'use strict';

const crc32 = require('./crc32');

const Fragment = require('../fragment');
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

class Packetizer {

    static packetize(fragment, sampleBuffers) {
        if (!(fragment instanceof Fragment)) {
            throw new Error('Argument 1 should be instance of Fragment');
        }
        let packetizer = new Packetizer(fragment, sampleBuffers);
        return packetizer.packFragment();
    }

    constructor(fragment, sampleBuffers) {
        this.fragment = fragment;
        this.sampleBuffers = sampleBuffers;
        this._pcrTimecode = 0;
        this._audioCounter = 0;
        this._videoCounter = 0;
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
            this._videoConfig = new Buffer(0);
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
        let packet = new Buffer(packetLength);

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
        let packet = new Buffer(packetLength);
        let pos = 0;

        // Write header
        packet[pos++] = 0;
        packet[pos++] = 0;
        packet[pos++] = 0;
        packet[pos++] = 1;
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
        let samplePos = 0;
        while (samplePos < buffer.length) {
            let nalSize = buffer.readInt32BE(samplePos);
            samplePos += 4;
            packet.writeUInt32BE(1, pos);
            pos += 4;
            buffer.copy(packet, pos, samplePos, samplePos + nalSize);
            samplePos += nalSize;
            pos += nalSize;
        }

        return packet;
    }

    _packAudioPayload(payload, sample, time) {
        let data = new Buffer(14 + payload.length);
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
        Packetizer._writeTime(data, pos, time, 0x20);
        pos += 5;

        // Copy payload to data
        payload.copy(data, pos);

        // Pack payload
        return this._packPayload(data, sample, AUDIO_PID);
    }

    _packVideoPayload(payload, payloadPos, chunkLength, sample, resTime, sampleTime) {
        let data = new Buffer(19 + chunkLength);
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
        Packetizer._writeTime(data, pos, resTime, 0x30);
        pos += 5;
        // DTS
        Packetizer._writeTime(data, pos, sampleTime, 0x10);
        pos += 5;

        // Copy payload to data
        payload.copy(data, pos, payloadPos, payloadPos + chunkLength);

        return this._packPayload(data, sample, VIDEO_PID);
    }

    _packPayload(payload, sample, pid) {
        let packetIndex = 0;
        let payloadPos = 0;
        let buffers = [];
        let buffersLength = 0;
        while (payloadPos < payload.length) {
            let lastBytes = payload.length - payloadPos;
            let adaptationFields = false;
            if ((sample instanceof VideoSample && 0 === packetIndex) || lastBytes < PACKET_SIZE - 4) {
                adaptationFields = true;
            }

            // Build packet
            let bufPacket = new Buffer(PACKET_SIZE);
            bufPacket[0] = SYNC_BYTE;
            bufPacket[1] = (0 === packetIndex ? 0x40 : 0) + ((pid >> 8) & 0x1f);
            bufPacket[2] = pid & 0xff;
            bufPacket[3] = adaptationFields ? 0x30 : 0x10;
            if (sample instanceof AudioSample) {
                bufPacket[3] += this._audioCounter;
                this._audioCounter = (this._audioCounter + 1) & 0xf;
            } else if (sample instanceof VideoSample) {
                bufPacket[3] += this._videoCounter;
                this._videoCounter = (this._videoCounter + 1) & 0xf;
            }
            let pos = 4;
            if (adaptationFields) {
                let adaptationLength = 0;
                if (sample instanceof VideoSample && 0 === packetIndex) {
                    adaptationLength = 7;
                }
                if (lastBytes < PACKET_SIZE - 5) {
                    adaptationLength = Math.max(adaptationLength, PACKET_SIZE - 5 - lastBytes);
                }
                bufPacket[pos++] = adaptationLength;
                if (0 < adaptationLength) {
                    let usedAdaptationLength = 1;
                    let adaptationFlags = 0;
                    if (sample instanceof VideoSample && 0 === packetIndex) {
                        adaptationFlags = sample.keyframe ? 0x50 : 0x10;
                        usedAdaptationLength += 6;
                        let time = this._pcrTimecode;
                        bufPacket[pos + 6] = 0;
                        bufPacket[pos + 5] = ((time & 0x1) << 7) | 0x7e;
                        time >>= 1;
                        bufPacket[pos + 4] = time & 0xff;
                        time >>= 8;
                        bufPacket[pos + 3] = time & 0xff;
                        time >>= 8;
                        bufPacket[pos + 2] = time & 0xff;
                        time >>= 8;
                        bufPacket[pos + 1] = time & 0xff;
                    }
                    bufPacket[pos] = adaptationFlags;
                    pos += usedAdaptationLength;
                    if (usedAdaptationLength < adaptationLength) {
                        bufPacket.fill(-1, pos, pos + adaptationLength - usedAdaptationLength);
                        pos += adaptationLength - usedAdaptationLength;
                    }
                }
            }

            let bufCapacity = bufPacket.length - pos;
            if (0 < bufCapacity) {
                payload.copy(bufPacket, pos, payloadPos, payloadPos + bufCapacity);
                payloadPos += bufCapacity;
            }

            packetIndex++;
            buffers.push(bufPacket);
            buffersLength += bufPacket.length;
        }
        return Buffer.concat(buffers, buffersLength);
    }

    _buildHeader() {
        let buf = new Buffer(2 * PACKET_SIZE);
        let pos = 0;

        // Write PAT packet
        buf[pos++] = SYNC_BYTE;
        buf[pos++] = ((PAT_PID >> 8) & 0x1f) + 0x40;
        buf[pos++] = PAT_PID & 0xff;
        buf[pos++] = 0x10; // 0x1f
        buf[pos++] = 0;

        let sectionLength = 13;
        buf[pos++] = 0;
        buf[pos++] = ((sectionLength >> 8) & 0x0f) + 0xb0;
        buf[pos++] = sectionLength & 0xff;
        buf[pos++] = 0;
        buf[pos++] = 1;
        buf[pos++] = 0xc1;
        buf[pos++] = 0;
        buf[pos++] = 0;
        buf[pos++] = 0;
        buf[pos++] = 1;
        buf[pos++] = ((PMP_PID >> 8) & 0x1f) + 0xe0;
        buf[pos++] = PMP_PID & 0xff;

        buf.writeInt32BE(crc32.checksum(buf, pos - sectionLength + 1, pos), pos);
        pos += 4;

        if (pos < PACKET_SIZE) {
            buf.fill(-1, pos, PACKET_SIZE);
            pos += PACKET_SIZE - pos;
        }

        // Write PMT packet
        buf[pos++] = SYNC_BYTE;
        buf[pos++] = ((PMP_PID >> 8) & 0x1f) + 0x40;
        buf[pos++] = PMP_PID & 0xff;
        buf[pos++] = 0x10; // 0x1f
        buf[pos++] = 0;

        sectionLength = 18 + (this.fragment.hasAudio() ? 5 : 0);
        buf[pos++] = 2;
        buf[pos++] = ((sectionLength >> 8) & 0x0f) + 0xb0;
        buf[pos++] = sectionLength & 0xff;
        buf[pos++] = 0;
        buf[pos++] = 1;
        buf[pos++] = 0xc1;
        buf[pos++] = 0;
        buf[pos++] = 0;
        buf[pos++] = ((VIDEO_PID >> 8) & 0x1f) + 0xe0;
        buf[pos++] = VIDEO_PID & 0xff;
        buf[pos++] = 0xf0;
        buf[pos++] = 0;

        // Video data
        buf[pos++] = STREAM_TYPES[this._videoCodecInfo.type()] || 0;
        buf[pos++] = ((VIDEO_PID >> 8) & 0x1f) + 0xe0;
        buf[pos++] = VIDEO_PID & 0xff;
        buf[pos++] = 0xf0;
        buf[pos++] = 0;

        // Audio data
        if (this.fragment.hasAudio()) {
            buf[pos++] = STREAM_TYPES[this._audioCodecInfo.type()] || 0;
            buf[pos++] = ((AUDIO_PID >> 8) & 0x1f) + 0xe0;
            buf[pos++] = AUDIO_PID & 0xff;
            buf[pos++] = 0xf0;
            buf[pos++] = 0;
        }

        buf.writeInt32BE(crc32.checksum(buf, pos - sectionLength + 1, pos), pos);
        pos += 4;

        if (pos < 2 * PACKET_SIZE) {
            buf.fill(-1, pos);
        }

        return buf;
    }

    _buildVideoConfig() {
        let units = this._videoCodecInfo.units();
        let data = new Buffer(4 * units.length + units.reduce(function (size, unit) {
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
    }

}

module.exports = Packetizer;
