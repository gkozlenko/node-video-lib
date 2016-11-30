# node-video-lib

[![Build Status](https://travis-ci.org/pipll/node-video-lib.svg?branch=master)](https://travis-ci.org/pipll/node-video-lib) [![npm](https://img.shields.io/npm/v/node-video-lib.svg)](https://www.npmjs.com/package/node-video-lib) [![Dependency Status](https://david-dm.org/pipll/node-video-lib.svg)](https://david-dm.org/pipll/node-video-lib) [![Code Climate](https://codeclimate.com/github/pipll/node-video-lib/badges/gpa.svg)](https://codeclimate.com/github/pipll/node-video-lib) ![GitHub license](https://img.shields.io/github/license/pipll/node-video-lib.svg)

Node.js Video Library

## Installation

```
npm install node-video-lib
```

## Usage

### Parse MP4 file

```javascript
const fs = require('fs');
const MP4Parser = require('node-video-lib').MP4Parser;

fs.open('/path/to/file.mp4', 'r', function(fd) {
    try {
        let movie = MP4Parser.parse(fd);
        // Work with movie
        console.log('Duration:', movie.relativeDuration());
    } catch (ex) {
        console.error('Error:', ex);
    } finally {
        fs.close(fd);
    }
});
```

### Create MPEG-TS chunks

```javascript
const fs = require('fs');
const MP4Parser = require('node-video-lib').MP4Parser;
const HLSPacketizer = require('node-video-lib').HLSPacketizer;

fs.open('/path/to/file.mp4', 'r', function(fd) {
    try {
        let movie = MP4Parser.parse(fd);
        for (let fragment of movie.fragments(5)) {
            let buffer = HLSPacketizer.packetize(fragment);
            // Now buffer contains MPEG-TS chunk
        }
    } catch (ex) {
        console.error('Error:', ex);
    } finally {
        fs.close(fd);
    }
});
```

## Classes

### Movie

A movie class

```javascript
const Movie = require('node-video-lib').Movie;
```

Properties:

* **file** *\<Integer\>* - File descriptor
* **duration** *\<Integer\>* - Fragment duration
* **timescale** *\<Integer\>* - Fragment timescale
* **tracks** *\<Array\>* - List of movie tracks

Methods:

* **relativeDuration()** - Movie duration in seconds
    * Return: *\<Number\>*
* **addTrack(track)** - Add a track to the tracks list
    * **track** *\<Track\>* - Track
* **videoTrack()** - Get the first video track
    * Return: *\<VideoTrack\>*
* **audioTrack()** - Get the first audio track
    * Return: *\<AudioTrack\>*
* **samples()** - Get a list of movie samples ordered by relative timestamp
    * Return: *\<Array\>*
* **fragments(fragmentDuration)** - Split the movie to a list of fragments with an appropriate duration
    * **fragmentDuration** *\<Integer\>* - Fragment duration
    * Return: *\<Array\>*

### Fragment

A movie fragment class

```javascript
const Fragment = require('node-video-lib').Fragment;
```

Properties:

* **file** *\<Integer\>* - File descriptor
* **timestamp** *\<Integer\>* - Fragment timestamp
* **duration** *\<Integer\>* - Fragment duration
* **timescale** *\<Integer\>* - Fragment timescale
* **videoExtraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Video codec information content
* **audioExtraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Audio codec information content
* **samples** *\<Array\>* - List of fragment samples

Methods:

* **relativeTimestamp()** - Fragment timestamp in seconds
    * Return: *\<Number\>*
* **relativeDuration()** - Fragment duration in seconds
    * Return: *\<Number\>*
* **addSample(sample)** - Add a sample to the samples list
    * **sample** *\<Sample\>* - Sample
* **readSamples()** - Read samples content

### Track

A general track class

```javascript
const Track = require('node-video-lib').Track;
```

Properties:

* **duration** *\<Integer\>* - Track duration
* **timescale** *\<Integer\>* - Track timescale
* **extraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Codec information content
* **samples** *\<Array\>* - List of track samples

Methods:

* **relativeDuration()** - Track duration in seconds
    * Return: *\<Number\>*
* **addSample(sample)** - Add a sample to the samples list
    * **sample** *\<Sample\>* - Sample
* **createSample()** - Create a new sample
    * Return: *\<Sample\>*

### Audio track

An audio track class. Extends the general track class

```javascript
const AudioTrack = require('node-video-lib').AudioTrack;
```

Properties:

* **channels** *\<Integer\>* - Number of audio channels
* **sampleRate** *\<Integer\>* - Audio sample rate
* **sampleSize** *\<Integer\>* - Audio sample size

Methods:

* **createSample()** - Create a new audio sample
    * Return: *\<AudioSample\>*

### Video track

A video track class. Extends the general track class

```javascript
const AudioTrack = require('node-video-lib').AudioTrack;
```

Properties:

* **width** *\<Integer\>* - Video width
* **height** *\<Integer\>* - Video height

Methods:

* **createSample()** - Create a new video sample
    * Return: *\<VideoSample\>*

### Sample

A general video sample class

```javascript
const Sample = require('node-video-lib').Sample;
```

Properties:

* **buffer** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Sample content
* **timestamp** *\<Integer\>* - Sample timestamp
* **timescale** *\<Integer\>* - Sample timescale
* **size** *\<Integer\>* - Sample size
* **offset** *\<Integer\>* - Sample offset in the file

Methods:

* **relativeTimestamp()** - Sample timestamp in seconds
    * Return: *\<Number\>*

### Audio sample

An audio sample class. Extends the general sample class

```javascript
const AudioSample = require('node-video-lib').AudioSample;
```

### Video sample

A video sample class. Extends the general sample class

```javascript
const VideoSample = require('node-video-lib').VideoSample;
```

Properties:

* **compositionOffset** *\<Integer\>* - Composition offset
* **keyframe** *\<Boolean\>* - Keyframe flag
