'use strict';

const crc32 = require('./crc32');
const TimeWriter = require('./time-writer');
const SampleCounter = require('./sample-counter');

const VideoSample = require('../video-sample');
const AudioSample = require('../audio-sample');
const CodecParser = require('../codecs/parser');
const CodecUtils = require('../codecs/utils');

const SYNC_BYTE = 0x47;
const PACKET_SIZE = 188;
const PACKET_TIMESCALE = 90000;
const TIME_OFFSET = 9000;

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
        this._counter = new SampleCounter();
        if (this.fragment.hasAudio()) {
            this._audioCodecInfo = CodecParser.parse(this.fragment.audioExtraData);
        } else {
            this._audioCodecInfo = null;
        }
        if (this.fragment.hasVideo()) {
            this._videoCodecInfo = CodecParser.parse(this.fragment.videoExtraData);
            this._videoConfig = this._buildVideoConfig();
            this._isH265 = this._videoCodecInfo.type() === CodecUtils.CODEC_H265;
        } else {
            this._videoCodecInfo = null;
            this._videoConfig = null;
            this._isH265 = false;
        }
    }

    packFragment() {
        const buffers = [];
        let buffersLength = 0;

        // Write header
        const header = this._buildHeader();
        buffers.push(header);
        buffersLength += header.length;

        // Write samples
        let fixOpenGop = true;
        for (let i = 0, l = this.fragment.samples.length; i < l; i++) {
            const sample = this.fragment.samples[i];
            const buffer = this.sampleBuffers[i];
            const dtsTime = TIME_OFFSET + Math.round(PACKET_TIMESCALE * sample.timestamp / sample.timescale);

            if (sample instanceof AudioSample) {
                const audioBuffer = this._packAudioPayload(buffer, sample, dtsTime);
                buffers.push(audioBuffer);
                buffersLength += audioBuffer.length;
            } else if (sample instanceof VideoSample) {
                const ptsTime = TIME_OFFSET + Math.round(PACKET_TIMESCALE * (sample.timestamp + sample.compositionOffset) / sample.timescale);
                const videoBuffer = this._packVideoPayload(buffer, sample, ptsTime, dtsTime, fixOpenGop && sample.keyframe);
                buffers.push(videoBuffer);
                buffersLength += videoBuffer.length;
                fixOpenGop = false;
            }
        }

        return Buffer.concat(buffers, buffersLength);
    }

    _packAudioPayload(buffer, sample, dtsTime) {
        const packetLength = 7 + buffer.length;
        const payloadLength = 14 + packetLength;

        let data = Buffer.allocUnsafe(payloadLength);
        let pos = 0;

        const pesPacketLength = payloadLength - 6;

        data[pos++] = 0; // packet_start_code_prefix
        data[pos++] = 0; // packet_start_code_prefix
        data[pos++] = 1; // packet_start_code_prefix
        data[pos++] = 0xc0; // stream_id
        data[pos++] = (pesPacketLength >> 8) & 0xff; // PES_packet_length
        data[pos++] = pesPacketLength & 0xff; // PES_packet_length
        data[pos++] = 0x80; // optional PES header - binary stream
        data[pos++] = 0x80; // optional PES header - PTS DTS indicator
        data[pos++] = 5; // length of the remainder of the PES header in bytes

        // DTS
        pos += TimeWriter.writePtsDts(data, pos, dtsTime, 0x20);

        // AAC header
        data[pos++] = 0xff;
        data[pos++] = 0xf1;
        data[pos++] = ((((this._audioCodecInfo.profileObjectType - 1) & 0x3) << 6) |
            ((this._audioCodecInfo.rateIndex << 2) & 0x3c) |
            ((this._audioCodecInfo.channelsIndex >> 2) & 0x1)) & 0xff;
        data[pos++] = (((this._audioCodecInfo.channelsIndex & 0x3) << 6) & 0xff) | (packetLength >> 11) & 0x03;
        data[pos++] = (packetLength >> 3) & 0xff;
        data[pos++] = ((packetLength & 0x07) << 5) | 0x1f;
        data[pos++] = 0xfc;

        // buffer
        buffer.copy(data, pos);

        // Pack payload
        return this._packPayload(data, sample, AUDIO_PID, dtsTime);
    }

    _packVideoPayload(buffer, sample, ptsTime, dtsTime, fixOpenGop) {
        let payloadLength = 25 + buffer.length + (sample.keyframe ? this._videoConfig.length : 0);
        if (this._isH265) {
            payloadLength++;
        }
        let data = Buffer.allocUnsafe(payloadLength);

        let pos = 0;

        data[pos++] = 0;    // packet_start_code_prefix
        data[pos++] = 0;    // packet_start_code_prefix
        data[pos++] = 1;    // packet_start_code_prefix
        data[pos++] = 0xe0; // stream_id
        data[pos++] = 0;    // PES_packet_length
        data[pos++] = 0;    // PES_packet_length
        data[pos++] = 0x80; // optional PES header - binary stream
        data[pos++] = 0xc0; // optional PES header - PTS DTS indicator
        data[pos++] = 10;   // length of the remainder of the PES header in bytes

        // PTS & DTS
        pos += TimeWriter.writePtsDts(data, pos, ptsTime, 0x30);
        pos += TimeWriter.writePtsDts(data, pos, dtsTime, 0x10);

        data[pos++] = 0;
        data[pos++] = 0;
        data[pos++] = 0;
        data[pos++] = 1;
        if (this._isH265) {
            data[pos++] = 70;
            data[pos++] = 0x01;
        } else {
            data[pos++] = 9;
        }
        data[pos++] = 0x10;
        if (sample.keyframe) {
            this._videoConfig.copy(data, pos);
            pos += this._videoConfig.length;
        }

        // Copy sample payload to data
        buffer.copy(data, pos);
        if (data.readUInt32BE(pos) !== 1) {
            // Convert AVCC -> Annex B
            while (pos < data.length) {
                const nalSize = data.readUInt32BE(pos);
                if (fixOpenGop && this._isH265) {
                    const byte0 = data[pos + 4];
                    const nalType = (byte0 & 0x7e) >> 1;
                    if (nalType === 21) { // CRA, Clean Random Access
                        const newNalType = 16; // BLA, Broken Link Access
                        data[pos + 4] = (byte0 & 0x81) | (newNalType << 1);
                    }
                }
                data.writeUInt32BE(1, pos);
                pos += 4 + nalSize;
            }
        }

        return this._packPayload(data, sample, VIDEO_PID, dtsTime);
    }

    _packPayload(payload, sample, pid, dtsTime) {
        // Check if this payload should have PRC or not
        let packetForPcr = this._videoCodecInfo !== null ? sample instanceof VideoSample : sample instanceof AudioSample;

        // Number of packets
        let numPackets = Math.ceil(payload.length / (PACKET_SIZE - 4));
        if (packetForPcr && numPackets * (PACKET_SIZE - 4) - 8 < payload.length) {
            // Take into account adaptation field for PCR
            numPackets++;
        }

        // Allocate a buffer
        let buffer = Buffer.allocUnsafe(PACKET_SIZE * numPackets);

        // Fill the buffer
        let payloadPos = 0;
        for (let index = 0; index < numPackets; index++) {
            let lastBytes = payload.length - payloadPos;
            let adaptationFields = false;
            if (0 === index && packetForPcr || lastBytes < PACKET_SIZE - 4) {
                adaptationFields = true;
            }

            let pos = index * PACKET_SIZE;
            buffer[pos++] = SYNC_BYTE;
            buffer[pos++] = (0 === index ? 0x40 : 0) | ((pid >> 8) & 0x1f);
            buffer[pos++] = pid & 0xff;
            buffer[pos++] = this._counter.next(pid) | (adaptationFields ? 0x30 : 0x10);

            if (adaptationFields) {
                let adaptationLength = 0;
                if (packetForPcr && 0 === index) {
                    adaptationLength = 7;
                }
                if (lastBytes < PACKET_SIZE - 5) {
                    adaptationLength = Math.max(adaptationLength, PACKET_SIZE - 5 - lastBytes);
                }
                buffer[pos++] = adaptationLength;
                if (0 < adaptationLength) {
                    let usedAdaptationLength = 1;
                    let adaptationFlags = 0;
                    if (packetForPcr && 0 === index) {
                        adaptationFlags = sample instanceof VideoSample && sample.keyframe ? 0x50 : 0x10;
                        let pcrTime = dtsTime - TIME_OFFSET;
                        usedAdaptationLength += TimeWriter.writePcr(buffer, pos + 1, pcrTime);
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
        buffer[pos++] = ((PAT_PID >> 8) & 0x1f) | 0x40;
        buffer[pos++] = PAT_PID & 0xff;
        buffer[pos++] = this._counter.next(PAT_PID) | 0x10;
        buffer[pos++] = 0;

        let sectionLength = 13;
        buffer[pos++] = 0;
        buffer[pos++] = ((sectionLength >> 8) & 0x0f) | 0xb0;
        buffer[pos++] = sectionLength & 0xff;
        buffer[pos++] = 0;
        buffer[pos++] = 1;
        buffer[pos++] = 0xc1;
        buffer[pos++] = 0;
        buffer[pos++] = 0;
        buffer[pos++] = 0;
        buffer[pos++] = 1;
        buffer[pos++] = ((PMP_PID >> 8) & 0x1f) | 0xe0;
        buffer[pos++] = PMP_PID & 0xff;

        buffer.writeUInt32BE(crc32.checksum(buffer, pos - sectionLength + 1, pos), pos);
        pos += 4;

        if (pos < PACKET_SIZE) {
            buffer.fill(-1, pos, PACKET_SIZE);
            pos += PACKET_SIZE - pos;
        }

        // Write PMT packet
        buffer[pos++] = SYNC_BYTE;
        buffer[pos++] = ((PMP_PID >> 8) & 0x1f) | 0x40;
        buffer[pos++] = PMP_PID & 0xff;
        buffer[pos++] = this._counter.next(PMP_PID) | 0x10;
        buffer[pos++] = 0;

        sectionLength = 13;
        let nextPid = 0;
        if (this._audioCodecInfo) {
            sectionLength += 5;
            nextPid = AUDIO_PID;
        }
        if (this._videoCodecInfo) {
            sectionLength += 5;
            nextPid = VIDEO_PID;
        }
        buffer[pos++] = 2;
        buffer[pos++] = ((sectionLength >> 8) & 0x0f) | 0xb0;
        buffer[pos++] = sectionLength & 0xff;
        buffer[pos++] = 0;
        buffer[pos++] = 1;
        buffer[pos++] = 0xc1;
        buffer[pos++] = 0;
        buffer[pos++] = 0;
        pos += PacketizerImpl._writePid(buffer, pos, nextPid);

        // Video data
        if (this._videoCodecInfo) {
            buffer[pos++] = STREAM_TYPES[this._videoCodecInfo.type()] || 0;
            pos += PacketizerImpl._writePid(buffer, pos, VIDEO_PID);
        }

        // Audio data
        if (this._audioCodecInfo) {
            buffer[pos++] = STREAM_TYPES[this._audioCodecInfo.type()] || 0;
            pos += PacketizerImpl._writePid(buffer, pos, AUDIO_PID);
        }

        buffer.writeUInt32BE(crc32.checksum(buffer, pos - sectionLength + 1, pos), pos);
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

    static _writePid(buffer, pos, pid) {
        buffer[pos + 0] = ((pid >> 8) & 0x1f) | 0xe0;
        buffer[pos + 1] = pid & 0xff;
        buffer[pos + 2] = 0xf0;
        buffer[pos + 3] = 0;

        return 4;
    }

}

module.exports = PacketizerImpl;
