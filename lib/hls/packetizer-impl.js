'use strict';

const crc32 = require('./crc32');
const SampleCounter = require('./sample-counter');

const VideoSample = require('../video-sample');
const AudioSample = require('../audio-sample');
const CodecParser = require('../codecs/parser');
const CodecUtils = require('../codecs/utils');

const SYNC_BYTE = 0x47;
const PACKET_SIZE = 188;
const MAX_VIDEO_PAYLOAD_SIZE = 0x7fff;

const PAT_PID = 0x0;
const PMP_PID = 0xfff;
const VIDEO_PID = 0x100;
const AUDIO_PID = 0x101;

const STREAM_TYPES = {
    [CodecUtils.CODEC_AAC]: 0x0f,
    [CodecUtils.CODEC_H264]: 0x1b,
    [CodecUtils.CODEC_H265]: 0x24,
};

class PacketizerImpl {

    constructor(fragment, sampleBuffers) {
        this.fragment = fragment;
        this.sampleBuffers = sampleBuffers;
        this._pcrTimecode = 0;
        this._counter = new SampleCounter();
        if (this.fragment.hasAudio()) {
            this._audioCodecInfo = CodecParser.parse(this.fragment.audioExtraData);
        } else {
            this._audioCodecInfo = null;
        }
        if (this.fragment.hasVideo()) {
            this._videoCodecInfo = CodecParser.parse(this.fragment.videoExtraData);
            this._videoConfig = this._buildVideoConfig();
        } else {
            this._videoCodecInfo = null;
            this._videoConfig = Buffer.allocUnsafe(0);
        }
    }

    packFragment() {
        let buffers = [];
        let buffersLength = 0;
        let packetTimescale = 90 * this.fragment.timescale;

        // Write header
        let header = this._buildHeader();
        buffers.push(header);
        buffersLength += header.length;

        // Write samples
        for (let i = 0, l = this.fragment.samples.length; i < l; i++) {
            let sample = this.fragment.samples[i];
            let buffer = this.sampleBuffers[i];
            let sampleTime = (packetTimescale * sample.timestamp / sample.timescale) << 0;
            this._pcrTimecode = Math.max(this._pcrTimecode, sampleTime);

            if (sample instanceof AudioSample) {
                let packet = this._convertAudioSample(buffer);
                let audioBuffer = this._packAudioPayload(packet, sample, sampleTime);
                buffers.push(audioBuffer);
                buffersLength += audioBuffer.length;
            } else if (sample instanceof VideoSample) {
                let sampleCompTime = (packetTimescale * sample.compositionOffset / sample.timescale) << 0;
                let resTime = sampleTime + sampleCompTime;

                let packet = this._convertVideoSample(buffer, sample.keyframe);
                let packetPos = 0;
                do {
                    let chunkLength = Math.min(MAX_VIDEO_PAYLOAD_SIZE, packet.length - packetPos);
                    let videoBuffer = this._packVideoPayload(packet, packetPos, chunkLength, sample, resTime, sampleTime);
                    buffers.push(videoBuffer);
                    buffersLength += videoBuffer.length;
                    packetPos += chunkLength;
                } while (packetPos < packet.length);
            }
        }

        return Buffer.concat(buffers, buffersLength);
    }

    _convertAudioSample(buffer) {
        let packetLength = 7 + buffer.length;
        let packet = Buffer.allocUnsafe(packetLength);

        // Write header
        packet[0] = 0xff;
        packet[1] = 0xf1;
        packet[2] = ((((this._audioCodecInfo.profileObjectType - 1) & 0x3) << 6) +
            ((this._audioCodecInfo.rateIndex << 2) & 0x3c) +
            ((this._audioCodecInfo.channelsIndex >> 2) & 0x1)) & 0xff;
        packet[3] = ((this._audioCodecInfo.channelsIndex & 0x3) << 6) & 0xff;
        packet[5] = (((packetLength & 0x7) << 5) + 0x5) & 0xff;
        packetLength >>= 3;
        packet[4] = packetLength & 0xff;
        packetLength >>= 8;
        packet[3] += packetLength & 0x3;
        packet[6] = 0xffc;

        // Copy buffer
        buffer.copy(packet, 7);

        return packet;
    }

    _convertVideoSample(buffer, isKeyframe) {
        let packetLength = 6 + buffer.length + (isKeyframe ? this._videoConfig.length : 0);
        if (this._videoCodecInfo.type() === CodecUtils.CODEC_H265) {
            packetLength++;
        }
        let packet = Buffer.allocUnsafe(packetLength);
        let pos = 0;

        // Write header
        packet.writeUInt32BE(1, pos);
        pos += 4;
        if (this._videoCodecInfo.type() === CodecUtils.CODEC_H265) {
            packet[pos++] = 70;
            packet[pos++] = 0x01;
        } else {
            packet[pos++] = 9;
        }
        packet[pos++] = 0x10;
        if (isKeyframe) {
            this._videoConfig.copy(packet, pos);
            pos += this._videoConfig.length;
        }

        // Copy NAL units
        buffer.copy(packet, pos);
        while (pos < packet.length) {
            let nalSize = packet.readInt32BE(pos);
            packet.writeUInt32BE(1, pos);
            pos += 4 + nalSize;
        }

        return packet;
    }

    _packAudioPayload(payload, sample, time) {
        let data = Buffer.allocUnsafe(14 + payload.length);
        let pos = 0;

        let pesPacketLength = (8 + payload.length) & 0xffff;

        data[pos++] = 0; // packet_start_code_prefix
        data[pos++] = 0; // packet_start_code_prefix
        data[pos++] = 1; // packet_start_code_prefix
        data[pos++] = 0xc0; // stream_id
        data[pos++] = (pesPacketLength >> 8) & 0xff; // PES_packet_length
        data[pos++] = pesPacketLength & 0xff; // PES_packet_length
        data[pos++] = 0x80;
        data[pos++] = 0x80;
        data[pos++] = 5;

        // PTS_DTS
        pos += PacketizerImpl._writeTime(data, pos, time, 0x20);

        // Copy payload to data
        payload.copy(data, pos);

        // Pack payload
        return this._packPayload(data, sample, AUDIO_PID);
    }

    _packVideoPayload(payload, payloadPos, chunkLength, sample, resTime, sampleTime) {
        let data = Buffer.allocUnsafe(19 + chunkLength);
        let pos = 0;

        let pesPacketLength = (13 + chunkLength) & 0xffff;

        data[pos++] = 0; // packet_start_code_prefix
        data[pos++] = 0; // packet_start_code_prefix
        data[pos++] = 1; // packet_start_code_prefix
        data[pos++] = 0xe0; // stream_id
        data[pos++] = (pesPacketLength >> 8) & 0xff; // PES_packet_length
        data[pos++] = pesPacketLength & 0xff; // PES_packet_length
        data[pos++] = 0 === payloadPos ? 0x84 : 0x80;
        data[pos++] = 0xc0;
        data[pos++] = 10;

        // PTS
        pos += PacketizerImpl._writeTime(data, pos, resTime, 0x30);
        // DTS
        pos += PacketizerImpl._writeTime(data, pos, sampleTime, 0x10);

        // Copy payload to data
        payload.copy(data, pos, payloadPos, payloadPos + chunkLength);

        return this._packPayload(data, sample, VIDEO_PID);
    }

    _packPayload(payload, sample, pid) {
        // Number of packets
        let numPackets = Math.ceil(payload.length / (PACKET_SIZE - 4));
        if (sample instanceof VideoSample && numPackets * (PACKET_SIZE - 4) - 8 < payload.length) {
            // Take into account adaptation field
            numPackets++;
        }
        // Allocate a buffer
        let buffer = Buffer.allocUnsafe(PACKET_SIZE * numPackets);

        // Fill the buffer
        let payloadPos = 0;
        for (let index = 0; index < numPackets; index++) {
            let lastBytes = payload.length - payloadPos;
            let adaptationFields = false;
            if (0 === index && sample instanceof VideoSample || lastBytes < PACKET_SIZE - 4) {
                adaptationFields = true;
            }

            let pos = index * PACKET_SIZE;
            buffer[pos++] = SYNC_BYTE;
            buffer[pos++] = (0 === index ? 0x40 : 0) + ((pid >> 8) & 0x1f);
            buffer[pos++] = pid & 0xff;
            buffer[pos++] = this._counter.next(sample) + (adaptationFields ? 0x30 : 0x10);

            if (adaptationFields) {
                let adaptationLength = 0;
                if (sample instanceof VideoSample && 0 === index) {
                    adaptationLength = 7;
                }
                if (lastBytes < PACKET_SIZE - 5) {
                    adaptationLength = Math.max(adaptationLength, PACKET_SIZE - 5 - lastBytes);
                }
                buffer[pos++] = adaptationLength;
                if (0 < adaptationLength) {
                    let usedAdaptationLength = 1;
                    let adaptationFlags = 0;
                    if (sample instanceof VideoSample && 0 === index) {
                        adaptationFlags = sample.keyframe ? 0x50 : 0x10;
                        usedAdaptationLength += 6;
                        buffer[pos + 1] = (this._pcrTimecode >> 25) & 0xff;
                        buffer[pos + 2] = (this._pcrTimecode >> 17) & 0xff;
                        buffer[pos + 3] = (this._pcrTimecode >> 9) & 0xff;
                        buffer[pos + 4] = (this._pcrTimecode >> 1) & 0xff;
                        buffer[pos + 5] = ((this._pcrTimecode & 0x1) << 7) | 0x7e;
                        buffer[pos + 6] = 0;
                    }
                    buffer[pos] = adaptationFlags;
                    pos += usedAdaptationLength;
                    if (usedAdaptationLength < adaptationLength) {
                        buffer.fill(-1, pos, pos + adaptationLength - usedAdaptationLength);
                        pos += adaptationLength - usedAdaptationLength;
                    }
                }
            }

            let capacity = (index + 1) * PACKET_SIZE - pos;
            if (0 < capacity) {
                payload.copy(buffer, pos, payloadPos, payloadPos + capacity);
                payloadPos += capacity;
            }
        }

        return buffer;
    }

    _buildHeader() {
        let buffer = Buffer.allocUnsafe(2 * PACKET_SIZE);
        let pos = 0;

        // Write PAT packet
        buffer[pos++] = SYNC_BYTE;
        buffer[pos++] = ((PAT_PID >> 8) & 0x1f) + 0x40;
        buffer[pos++] = PAT_PID & 0xff;
        buffer[pos++] = 0x10; // 0x1f
        buffer[pos++] = 0;

        let sectionLength = 13;
        buffer[pos++] = 0;
        buffer[pos++] = ((sectionLength >> 8) & 0x0f) + 0xb0;
        buffer[pos++] = sectionLength & 0xff;
        buffer[pos++] = 0;
        buffer[pos++] = 1;
        buffer[pos++] = 0xc1;
        buffer[pos++] = 0;
        buffer[pos++] = 0;
        buffer[pos++] = 0;
        buffer[pos++] = 1;
        buffer[pos++] = ((PMP_PID >> 8) & 0x1f) + 0xe0;
        buffer[pos++] = PMP_PID & 0xff;

        buffer.writeInt32BE(crc32.checksum(buffer, pos - sectionLength + 1, pos), pos);
        pos += 4;

        if (pos < PACKET_SIZE) {
            buffer.fill(-1, pos, PACKET_SIZE);
            pos += PACKET_SIZE - pos;
        }

        // Write PMT packet
        buffer[pos++] = SYNC_BYTE;
        buffer[pos++] = ((PMP_PID >> 8) & 0x1f) + 0x40;
        buffer[pos++] = PMP_PID & 0xff;
        buffer[pos++] = 0x10; // 0x1f
        buffer[pos++] = 0;

        sectionLength = 13;
        let nextPid = 0;
        if (this.fragment.hasAudio()) {
            sectionLength += 5;
            nextPid = AUDIO_PID;
        }
        if (this.fragment.hasVideo()) {
            sectionLength += 5;
            nextPid = VIDEO_PID;
        }
        buffer[pos++] = 2;
        buffer[pos++] = ((sectionLength >> 8) & 0x0f) + 0xb0;
        buffer[pos++] = sectionLength & 0xff;
        buffer[pos++] = 0;
        buffer[pos++] = 1;
        buffer[pos++] = 0xc1;
        buffer[pos++] = 0;
        buffer[pos++] = 0;
        pos += PacketizerImpl._writePid(buffer, pos, nextPid);

        // Video data
        if (this.fragment.hasVideo()) {
            buffer[pos++] = STREAM_TYPES[this._videoCodecInfo.type()] || 0;
            pos += PacketizerImpl._writePid(buffer, pos, VIDEO_PID);
        }

        // Audio data
        if (this.fragment.hasAudio()) {
            buffer[pos++] = STREAM_TYPES[this._audioCodecInfo.type()] || 0;
            pos += PacketizerImpl._writePid(buffer, pos, AUDIO_PID);
        }

        buffer.writeInt32BE(crc32.checksum(buffer, pos - sectionLength + 1, pos), pos);
        pos += 4;

        if (pos < 2 * PACKET_SIZE) {
            buffer.fill(-1, pos);
        }

        return buffer;
    }

    _buildVideoConfig() {
        let units = this._videoCodecInfo.units();
        let data = Buffer.allocUnsafe(4 * units.length + units.reduce(function (size, unit) {
            return size + unit.length;
        }, 0));
        let pos = 0;
        for (let i = 0, l = units.length; i < l; i++) {
            let unit = units[i];
            data.writeUInt32BE(1, pos);
            unit.copy(data, pos + 4);
            pos += unit.length + 4;
        }
        return data;
    }

    static _writeTime(buffer, pos, time, base) {
        buffer[pos + 0] = ((time >> 29) & 0x0e) | (base & 0xf0) | 0x1;
        buffer[pos + 1] = time >> 22;
        buffer[pos + 2] = (time >> 14) | 0x1;
        buffer[pos + 3] = time >> 7;
        buffer[pos + 4] = (time << 1) | 0x1;

        return 5;
    }

    static _writePid(buffer, pos, pid) {
        buffer[pos + 0] = ((pid >> 8) & 0x1f) + 0xe0;
        buffer[pos + 1] = pid & 0xff;
        buffer[pos + 2] = 0xf0;
        buffer[pos + 3] = 0;

        return 4;
    }

}

module.exports = PacketizerImpl;
