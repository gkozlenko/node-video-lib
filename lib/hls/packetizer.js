'use strict';

const crc32 = require('./crc32');

const Fragment = require('../fragment');
const FragmentReader = require('../fragment-reader');
const VideoSample = require('../video-sample');
const AudioSample = require('../audio-sample');
const ExtraParserAac = require('../extra-parsers/extra-parser-aac');
const ExtraParserH264 = require('../extra-parsers/extra-parser-h264');

const SYNC_BYTE = 0x47;
const PACKET_SIZE = 188;
const VIDEO_PID = 258;
const AUDIO_PID = 259;
const PMP_PID = 4095;
const AUDIO_SAMPLES_PACK = 5;
const MAX_PAYLOAD_SIZE = 32725;

class Packetizer {

    static packetize(fragment, fd) {
        if (!(fragment instanceof Fragment)) {
            throw new Error('Argument 1 should be instance of Fragment');
        }
        let packetizer = new Packetizer(fragment, fd);
        return packetizer.packFragment();
    }

    constructor(fragment, fd) {
        this.fragment = fragment;
        this.sampleBuffers = [];
        this.file = fd;
        this._lastVideoSampleTime = -1;
        this._lastAudioSampleTime = -1;
        this._lastSampleTime = -1;
        this._audioCounter = 0;
        this._videoCounter = 0;
        this._videoExtraParser = this.fragment.videoExtraData ? ExtraParserH264.parse(this.fragment.videoExtraData) : null;
        this._audioExtraParser = this.fragment.audioExtraData ? ExtraParserAac.parse(this.fragment.audioExtraData) : null;
    }

    packFragment() {
        // Read samples data
        this.sampleBuffers = FragmentReader.readSamples(this.fragment, this.file);

        let buffers = [];
        let buffersLength = 0;

        // Write header
        let header = this._buildHeader();
        buffers.push(header);
        buffersLength += header.length;

        let audioPayloadSamplesCount = 0;
        let audioPayloadSampleTime = 0;
        let audioPayloadSample = null;
        let audioPayloads = [];
        let audioPayloadsLength = 0;

        for (let i = 0, l = this.fragment.samples.length; i < l; i++) {
            let sample = this.fragment.samples[i];
            let packetSize = this.sampleBuffers[i].readInt32BE(0) + 4;
            let packet = this.sampleBuffers[i];
            let sampleTime = (90 * sample.relativeTimestamp() * this.fragment.timescale) << 0;

            if (sample instanceof AudioSample) {
                this._lastAudioSampleTime = sampleTime;

                if (0 === audioPayloadSamplesCount) {
                    audioPayloadSampleTime = sampleTime;
                    audioPayloadSample = sample;
                }
                let partPayload = new Buffer(7 + packet.length);
                let size = partPayload.length;

                partPayload[0] = 0xff;
                partPayload[1] = 0xf1;
                partPayload[2] = ((((this._audioExtraParser.profileObjectType - 1) & 0x3) << 6)
                    + ((this._audioExtraParser.rateIndex << 2) & 0x3c)
                    + ((this._audioExtraParser.channelsIndex >> 2) & 0x1)) & 0xff;
                partPayload[3] = ((this._audioExtraParser.channelsIndex & 0x3) << 6) & 0xff;
                partPayload[5] = (((size & 0x7) << 5) + 0x5) & 0xff;
                size >>= 3;
                partPayload[4] = size & 0xff;
                size >>= 8;
                partPayload[3] += size & 0x3;
                partPayload[6] = 0xffc;

                packet.copy(partPayload, 7);
                audioPayloads.push(partPayload);
                audioPayloadsLength += partPayload.length;
                audioPayloadSamplesCount++;

                if ((audioPayloadSamplesCount === AUDIO_SAMPLES_PACK) && audioPayloadsLength > 0) {
                    let audioBuffer = this._packAudioPayload(Buffer.concat(audioPayloads, audioPayloadsLength), audioPayloadSample, audioPayloadSampleTime);
                    buffers.push(audioBuffer);
                    buffersLength += audioBuffer.length;
                    audioPayloadSamplesCount = 0;
                    audioPayloads = [];
                    audioPayloadsLength = 0;
                }
            } else if (sample instanceof VideoSample) {
                this._lastVideoSampleTime = sampleTime;

                let sampleCompTime = (90 * sample.compositionOffset * this.fragment.timescale / sample.timescale) << 0;
                let resTime = sampleTime + sampleCompTime;

                // Fix sample
                if (packetSize < packet.length) {
                    packet[packetSize] = 0;
                    packet[packetSize + 1] = 0;
                    packet[packetSize + 2] = 0;
                    packet[packetSize + 3] = 0x1;
                }

                let bufConfig = sample.keyframe ? this._videoConfig() : new Buffer(0);

                // Build new packet
                let newPacket = new Buffer(6 + packet.length + bufConfig.length);
                let newPos = 0;
                newPacket[newPos++] = 0;
                newPacket[newPos++] = 0;
                newPacket[newPos++] = 0;
                newPacket[newPos++] = 0x1;
                newPacket[newPos++] = 0x9;
                newPacket[newPos++] = sample.keyframe ? 0x10 : 0x30;

                if (bufConfig.length > 0) {
                    bufConfig.copy(newPacket, newPos);
                    newPos += bufConfig.length;
                }
                newPacket[newPos++] = 0;
                newPacket[newPos++] = 0;
                newPacket[newPos++] = 0;
                newPacket[newPos++] = 0x1;
                packet.copy(newPacket, newPos, 4);
                packet = newPacket;

                let packetPos = 0;
                do {
                    let chunkLength = Math.min(MAX_PAYLOAD_SIZE, packet.length - packetPos);

                    // Build payload from sample
                    let payload = new Buffer(19 + chunkLength);
                    let pos = 0;

                    let pesPacketLength = (13 + chunkLength) & 0xffff;

                    payload[pos++] = 0; // packet_start_code_prefix
                    payload[pos++] = 0; // packet_start_code_prefix
                    payload[pos++] = 1; // packet_start_code_prefix
                    payload[pos++] = 0xe0; // stream_id
                    payload[pos++] = (pesPacketLength >> 8) & 0xff; // PES_packet_length
                    payload[pos++] = pesPacketLength & 0xff; // PES_packet_length
                    payload[pos++] = 0 === packetPos ? 0x84 : 0x80;
                    payload[pos++] = 0xc0;
                    payload[pos++] = 10;

                    // PTS_DTS
                    this._writeTime(payload, pos, resTime);
                    pos += 5;
                    this._writeTime(payload, pos, sampleTime);
                    pos += 5;

                    packet.copy(payload, pos, packetPos, packetPos + chunkLength);

                    let packerBuffer = this._packPayload(payload, sample, VIDEO_PID);
                    buffers.push(packerBuffer);
                    buffersLength += packerBuffer.length;

                    packetPos += chunkLength;
                } while (packetPos < packet.length);
            }
        }

        // Latest audio payload
        if (audioPayloadsLength > 0) {
            let lastAudioBuffer = this._packAudioPayload(Buffer.concat(audioPayloads, audioPayloadsLength), audioPayloadSample, audioPayloadSampleTime);
            buffers.push(lastAudioBuffer);
            buffersLength += lastAudioBuffer.length;
        }

        return Buffer.concat(buffers, buffersLength);
    }

    _packAudioPayload(payload, sample, time) {
        // Build payload from sample
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
        this._writeTime(data, pos, time);
        pos += 5;

        // Copy payload to data
        payload.copy(data, pos);

        // Pack payload
        return this._packPayload(data, sample, AUDIO_PID);
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
            bufPacket[1] = 0;
            if (0 === packetIndex) {
                bufPacket[1] = 0x40;
            }
            bufPacket[1] += (pid >> 8) & 0x1f;
            bufPacket[2] = pid & 0xff;
            bufPacket[3] = adaptationFields ? 0x30 : 0x10;
            if (sample instanceof AudioSample) {
                bufPacket[3] += this._audioCounter & 0xf;
                this._audioCounter++;
            } else if (sample instanceof VideoSample) {
                bufPacket[3] += this._videoCounter & 0xf;
                this._videoCounter++;
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
                    if (sample instanceof VideoSample && 0 === packetIndex && sample.keyframe) {
                        adaptationFlags = 0x40;
                    }
                    if (sample instanceof VideoSample && 0 === packetIndex) {
                        adaptationFlags += 0x10;
                        usedAdaptationLength += 6;
                        let time = this._pcrTimecode();
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
        let headerBuf = new Buffer(2 * PACKET_SIZE);
        let headerPos = 0;

        // Write PAM packet
        headerBuf[headerPos++] = SYNC_BYTE;
        headerBuf[headerPos++] = 0x40;
        headerBuf[headerPos++] = 0;
        headerBuf[headerPos++] = 0x10;
        headerBuf[headerPos++] = 0;

        let sectionLength = 13;

        let mapBuf = new Buffer(12);
        let mapPos = 0;
        mapBuf[mapPos++] = 0;
        mapBuf[mapPos++] = ((sectionLength >> 8) & 0x0f) + 0xb0;
        mapBuf[mapPos++] = sectionLength & 0xff;
        mapBuf[mapPos++] = 0;
        mapBuf[mapPos++] = 1;
        mapBuf[mapPos++] = 0xc1;
        mapBuf[mapPos++] = 0;
        mapBuf[mapPos++] = 0;
        mapBuf[mapPos++] = 0;
        mapBuf[mapPos++] = 1;
        mapBuf[mapPos++] = ((PMP_PID >> 8) & 0x1f) + 0xe0;
        mapBuf[mapPos++] = PMP_PID & 0xff;
        mapBuf.copy(headerBuf, headerPos);
        headerPos += mapBuf.length;
        headerBuf.writeInt32BE(crc32.checksum(mapBuf), headerPos);
        headerPos += 4;

        if (headerPos < PACKET_SIZE) {
            let emptyBuf = new Buffer(PACKET_SIZE - headerPos);
            emptyBuf.fill(-1);
            emptyBuf.copy(headerBuf, headerPos);
            headerPos += emptyBuf.length;
        }

        // Write PAM packet
        headerBuf[headerPos++] = SYNC_BYTE;
        headerBuf[headerPos++] = ((PMP_PID >> 8) & 0x1f) + 0x40;
        headerBuf[headerPos++] = PMP_PID & 0xff;
        headerBuf[headerPos++] = 0x10;
        headerBuf[headerPos++] = 0;

        sectionLength = (18 + (this.fragment.audioExtraData ? 5 : 0)) & 0xffff;
        mapBuf = new Buffer(17 + (this.fragment.audioExtraData ? 5 : 0));
        mapPos = 0;
        mapBuf[mapPos++] = 2;
        mapBuf[mapPos++] = ((sectionLength >> 8) & 0x0f) + 0xb0;
        mapBuf[mapPos++] = sectionLength & 0xff;
        mapBuf[mapPos++] = 0;
        mapBuf[mapPos++] = 1;
        mapBuf[mapPos++] = 0xc1;
        mapBuf[mapPos++] = 0;
        mapBuf[mapPos++] = 0;
        mapBuf[mapPos++] = ((VIDEO_PID >> 8) & 0x1f) + 0xe0;
        mapBuf[mapPos++] = VIDEO_PID & 0xff;
        mapBuf[mapPos++] = 0xf0;
        mapBuf[mapPos++] = 0;

        // Video data
        mapBuf[mapPos++] = 0x1b;
        mapBuf[mapPos++] = ((VIDEO_PID >> 8) & 0x1f) + 0xe0;
        mapBuf[mapPos++] = VIDEO_PID & 0xff;
        mapBuf[mapPos++] = 0xf0;
        mapBuf[mapPos++] = 0;

        // Audio data
        if (this.fragment.audioExtraData) {
            mapBuf[mapPos++] = 0x0f;
            mapBuf[mapPos++] = ((AUDIO_PID >> 8) & 0x1f) + 0xe0;
            mapBuf[mapPos++] = AUDIO_PID & 0xff;
            mapBuf[mapPos++] = 0xf0;
            mapBuf[mapPos++] = 0;
        }

        mapBuf.copy(headerBuf, headerPos);
        headerPos += mapBuf.length;
        headerBuf.writeInt32BE(crc32.checksum(mapBuf), headerPos);
        headerPos += 4;

        if (headerPos < 2 * PACKET_SIZE) {
            headerBuf.fill(-1, headerPos);
        }

        return headerBuf;
    }

    _pcrTimecode() {
        let sampleTime = -1;
        if (this._lastVideoSampleTime >= 0 && this._lastAudioSampleTime >= 0) {
            sampleTime = Math.min(this._lastVideoSampleTime, this._lastAudioSampleTime);
        } else if (this._lastAudioSampleTime >= 0) {
            sampleTime = this._lastAudioSampleTime;
        } else if (this._lastVideoSampleTime >= 0) {
            sampleTime = this._lastVideoSampleTime;
        }
        if (this._lastSampleTime !== -1 && sampleTime < this._lastSampleTime) {
            sampleTime = this._lastSampleTime;
        }
        if (sampleTime < 0) {
            sampleTime = 0;
        }
        this._lastSampleTime = sampleTime;
        return sampleTime;
    }

    _videoConfig() {
        let units = [this._videoExtraParser.sps, this._videoExtraParser.pps].reduce((a, b) => a.concat(b), []);
        let data = new Buffer(4 * units.length + units.reduce(function (size, unit) {
            return size + unit.length;
        }, 0));
        let pos = 0;
        for (let unit of units) {
            data[pos++] = 0;
            data[pos++] = 0;
            data[pos++] = 0;
            data[pos++] = 0x1;
            unit.copy(data, pos);
            pos += unit.length;
        }
        return data;
    }

    _writeTime(buffer, pos, time) {
        buffer[pos + 4] = ((time & 0x7f) << 1) + 0x1;
        time >>= 7;
        buffer[pos + 3] = time & 0xff;
        time >>= 8;
        buffer[pos + 2] = ((time & 0x7f) << 1) + 0x1;
        time >>= 7;
        buffer[pos + 1] = time & 0xff;
        time >>= 8;
        buffer[pos + 0] = ((time & 0x7) << 1) + 0x21;
    }


}

module.exports = Packetizer;
