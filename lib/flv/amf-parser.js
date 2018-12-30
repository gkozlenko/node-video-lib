'use strict';

const TYPE_NUMBER            = 0x00;
const TYPE_BOOLEAN           = 0x01;
const TYPE_STRING            = 0x02;
const TYPE_OBJECT            = 0x03;
// const TYPE_MOVIECLIP         = 0x04; // reserved, not supported
const TYPE_NULL              = 0x05;
const TYPE_UNDEFINED         = 0x06;
const TYPE_REFERENCE         = 0x07;
const TYPE_ECMA_ARRAY        = 0x08;
const TYPE_OBJECT_END        = 0x09;
const TYPE_STRICT_ARRAY      = 0x0a;
const TYPE_DATE              = 0x0b;
const TYPE_LONG_STRING       = 0x0c;
const TYPE_UNSUPPORTED       = 0x0d;
// const TYPE_RECORDSET         = 0x0e; // reserved, not supported
const TYPE_XML_DOCUMENT      = 0x0f;
// const TYPE_TYPED_OBJECT      = 0x10; // not implemented
// const TYPE_AVMPLUS_OBJECT    = 0x11; // not implemented

class AmfReader {

    constructor(buffer) {
        this.buffer = buffer;
        this.pos = 0;
    }

    read() {
        let data = [];
        while (this.pos < this.buffer.length) {
            data.push(this._readByType(this._readByte()));
        }
        return data;
    }

    _readByType(type) {
        switch (type) {
            case TYPE_NUMBER: {
                return this._readDouble();
            }
            case TYPE_BOOLEAN: {
                return this._readBoolean();
            }
            case TYPE_STRING: {
                return this._readString();
            }
            case TYPE_OBJECT: {
                return this._readObject();
            }
            case TYPE_NULL: {
                return null;
            }
            case TYPE_UNDEFINED: {
                return undefined;
            }
            case TYPE_UNSUPPORTED: {
                return null;
            }
            case TYPE_REFERENCE: {
                return this._readReference();
            }
            case TYPE_ECMA_ARRAY: {
                return this._readEcmaArray();
            }
            case TYPE_STRICT_ARRAY: {
                return this._readStrictArray();
            }
            case TYPE_DATE: {
                return this._readDate();
            }
            case TYPE_LONG_STRING: {
                return this._readLongString();
            }
            case TYPE_XML_DOCUMENT: {
                return this._readXmlDocument();
            }
        }
    }

    _readByte() {
        return this.buffer[this.pos++];
    }

    _readDouble() {
        let value = this.buffer.readDoubleBE(this.pos);
        this.pos += 8;
        return value;
    }

    _readBoolean() {
        return 0 !== this._readByte();
    }

    _readString() {
        let size = this.buffer.readUInt16BE(this.pos);
        this.pos += 2;
        let value = this.buffer.toString('utf8', this.pos, this.pos + size);
        this.pos += size;
        return value;
    }

    _readObject() {
        let object = {};
        let key, type;
        do {
            key = this._readString();
            type = this._readByte();
            if (type !== TYPE_OBJECT_END) {
                object[key] = this._readByType(type);
            }
        } while (type !== TYPE_OBJECT_END);
        return object;
    }

    _readReference() {
        let index = this.buffer.readUInt16BE(this.pos);
        this.pos += 2;
        return `Reference #${index}`;
    }

    _readEcmaArray() {
        this.pos += 4;
        return this._readObject();
    }

    _readStrictArray() {
        let size = this.buffer.readUInt32BE(this.pos);
        this.pos += 4;
        let array = [];
        for (let i = 0; i < size; i++) {
            array.push(this._readByType(this._readByte()));
        }
        return array;
    }

    _readDate() {
        let value = this.buffer.readDoubleBE(this.pos + 2);
        this.pos += 10;
        return value;
    }

    _readLongString() {
        let size = this.buffer.readUInt32BE(this.pos);
        this.pos += 4;
        let value = this.buffer.toString('utf8', this.pos, this.pos + size);
        this.pos += size;
        return value;
    }

    _readXmlDocument() {
        return this._readLongString();
    }

}

class AmfParser {

    static parse(buffer) {
        let reader = new AmfReader(buffer);
        return reader.read();
    }

}

module.exports = AmfParser;
