# node-video-lib

[![Build Status](https://travis-ci.org/gkozlenko/node-video-lib.svg?branch=master)](https://travis-ci.org/gkozlenko/node-video-lib)
[![npm Version](https://img.shields.io/npm/v/node-video-lib.svg)](https://www.npmjs.com/package/node-video-lib)
[![Maintainability](https://api.codeclimate.com/v1/badges/5244de41aaa07c082764/maintainability)](https://codeclimate.com/github/gkozlenko/node-video-lib/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/5244de41aaa07c082764/test_coverage)](https://codeclimate.com/github/gkozlenko/node-video-lib/test_coverage)
[![GitHub License](https://img.shields.io/github/license/gkozlenko/node-video-lib.svg)](https://github.com/gkozlenko/node-video-lib/blob/master/LICENSE)
[![Donate using PayPal](https://img.shields.io/badge/paypal-donate-green.svg)](https://www.paypal.me/pipll)
[![Buy me a Coffee](https://img.shields.io/badge/buy%20me%20a%20coffee-donate-green.svg)](https://www.buymeacoffee.com/NIUeF95)

Node.js Video Library / MP4 & FLV parser / MP4 builder / HLS muxer

## Limitations

**This library works only with MP4 and FLV video files encoded using H.264/H.265 video codecs and AAC audio codec.**

## Installation

```bash
$ npm install node-video-lib
```

## Usage

### Parse video file

```javascript
const fs = require('fs');
const VideoLib = require('node-video-lib');

fs.open('/path/to/file', 'r', function(err, fd) {
    try {
        let movie = VideoLib.MovieParser.parse(fd);
        // Work with movie
        console.log('Duration:', movie.relativeDuration());
    } catch (ex) {
        console.error('Error:', ex);
    } finally {
        fs.closeSync(fd);
    }
});
```

### Create MPEG-TS chunks

```javascript
const fs = require('fs');
const VideoLib = require('node-video-lib');

fs.open('/path/to/file', 'r', function(err, fd) {
    try {
        let movie = VideoLib.MovieParser.parse(fd);
        let fragmentList = VideoLib.FragmentListBuilder.build(movie, 5);
        for (let i = 0; i < fragmentList.count(); i++) {
            let fragment = fragmentList.get(i);
            let sampleBuffers = VideoLib.FragmentReader.readSamples(fragment, fd);
            let buffer = VideoLib.HLSPacketizer.packetize(fragment, sampleBuffers);
            // Now buffer contains MPEG-TS chunk
        }
    } catch (ex) {
        console.error('Error:', ex);
    } finally {
        fs.closeSync(fd);
    }
});
```

### Build MP4 file

```javascript
const fs = require('fs');
const VideoLib = require('node-video-lib');

fs.open('/path/to/file', 'r', function(err, fd) {
    try {
        let movie = VideoLib.MovieParser.parse(fd);
        fs.open('/path/to/output.mp4', 'w', function(err, fw) {
            try {
                VideoLib.MP4Builder.build(movie, fd, fw);
            } catch (ex) {
                console.error('Error:', ex);
            } finally {
                fs.closeSync(fw);
            }
        }
    } catch (ex) {
        console.error('Error:', ex);
    } finally {
        fs.closeSync(fd);
    }
});
```

### Create index file

```javascript
const fs = require('fs');
const VideoLib = require('node-video-lib');

fs.open('/path/to/file', 'r', function(err, fd) {
    try {
        let movie = VideoLib.MovieParser.parse(fd);
        let fragmentList = VideoLib.FragmentListBuilder.build(movie, 5);
        console.log('Duration:', fragmentList.relativeDuration());
        fs.open('/path/to/index.idx', 'w', function(err, fdi) {
            try {
                VideoLib.FragmentListIndexer.index(fragmentList, fdi);
            } catch (ex) {
                console.error('Error:', ex);
            } finally {
                fs.closeSync(fdi);
            }
        });
    } catch (ex) {
        console.error('Error:', ex);
    } finally {
        fs.closeSync(fd);
    }
});
```

### Create MPEG-TS chunks using index file

```javascript
const fs = require('fs');
const VideoLib = require('node-video-lib');

fs.open('/path/to/file', 'r', function(err, fd) {
    fs.open('/path/to/index.idx', 'r', function(err, fdi) {
        try {
            let fragmentList = VideoLib.FragmentListIndexer.read(fdi);
            console.log('Duration:', fragmentList.relativeDuration());
            for (let i = 0; i < fragmentList.count(); i++) {
                let fragment = fragmentList.get(i);
                let sampleBuffers = VideoLib.FragmentReader.readSamples(fragment, fd);
                let buffer = VideoLib.HLSPacketizer.packetize(fragment, sampleBuffers);
                // Now buffer contains MPEG-TS chunk
            }
        } catch (ex) {
            console.error('Error:', ex);
        } finally {
            fs.closeSync(fd);
            fs.closeSync(fdi);
        }
    });
});
```

## Classes

### MovieParser

A tool for parsing video files (MP4 or FLV).

```javascript
const MovieParser = require('node-video-lib').MovieParser
```

Methods:

* **parse(source)** - Parse video file
    * **source** *\<Integer\>*|[*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Source (File descriptor or Buffer)
    * Return: [*\<Movie\>*](#movie)

### MP4Parser

A tool for parsing MP4 video files.

```javascript
const MP4Parser = require('node-video-lib').MP4Parser
```

Methods:

* **parse(source)** - Parse MP4 file
    * **source** *\<Integer\>*|[*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Source (File descriptor or Buffer)
    * Return: [*\<Movie\>*](#movie)
* **check(buffer)** - Check MP4 header
    * **buffer** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - File header (first 8 bytes)
    * Return: *\<boolean\>*

### FLVParser

A tool for parsing FLV video files.

```javascript
const FLVParser = require('node-video-lib').FLVParser
```

Methods:

* **parse(source)** - Parse FLV file
    * **source** *\<Integer\>*|[*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Source (File descriptor or Buffer)
    * Return: [*\<Movie\>*](#movie)
* **check(buffer)** - Check FLV header
    * **buffer** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - File header (first 8 bytes)
    * Return: *\<boolean\>*

### MP4Builder

A tool for building MP4 video files.

```javascript
const MP4Builder = require('node-video-lib').MP4Builder
```

Methods:

* **build(movie, source, fd)** - Build MP4 file
    * **movie** [*\<Movie\>*](#movie) - Movie
    * **source** *\<Integer\>*|[*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Source (File descriptor or Buffer)
    * **fd** *\<Integer\>* - File descriptor

### HLSPacketizer

A tool for creating MPEG-TS chunks.

```javascript
const HLSPacketizer = require('node-video-lib').HLSPacketizer
```

Methods:

* **packetize(fragment, sampleBuffers)** - Create MPEG-TS chunk from movie fragment
    * **fragment** [*\<Fragment\>*](#fragment) - Movie fragment
    * **sampleBuffers** *\<Array\>* - Array of buffers
    * Return: [*\<Buffer\>*](https://nodejs.org/api/buffer.html)

### FragmentListBuilder

A tool for splitting the movie into a list of fragments.

```javascript
const FragmentListBuilder = require('node-video-lib').FragmentListBuilder
```

Methods:

* **build(movie, fragmentDuration)** - Split the movie to a list of fragments with an appropriate duration
    * **movie** [*\<Movie\>*](#movie) - Movie
    * **fragmentDuration** *\<Integer\>* - Fragment duration
    * Return: [*\<FragmentList\>*](#fragmentlist)

### FragmentListIndexer

A tool to work with index files.

```javascript
const FragmentListIndexer = require('node-video-lib').FragmentListIndexer
```

Methods:

* **index(fragmentList, fd)** - Index fragment list
    * **fragmentList** [*\<FragmentList\>*](#fragmentlist) - Fragment list
    * **fd** *\<Integer\>* - File descriptor
* **read(fd)** - Read fragment list from index
    * **fd** *\<Integer\>* - File descriptor
    * Return: [*\<FragmentList\>*](#fragmentlist)

### FragmentReader

A tool for reading samples data of the given movie fragment.

```javascript
const FragmentReader = require('node-video-lib').FragmentReader
```

Methods:

* **readSamples(fragment, source)** - Read samples data
    * **fragment** [*\<Fragment\>*](#fragment) - Movie fragment
    * **source** *\<Integer\>*|[*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Source (File descriptor or Buffer)
    * Return: *\<Array\>* Array of buffers

### Movie

A movie class

```javascript
const Movie = require('node-video-lib').Movie
```

Properties:

* **duration** *\<Integer\>* - Movie duration
* **timescale** *\<Integer\>* - Movie timescale
* **tracks** *\<Array\>* - List of movie tracks

Methods:

* **relativeDuration()** - Movie duration in seconds
    * Return: *\<Number\>*
* **resolution()** - Video resolution
    * Return: *\<String\>*
* **size()** - Samples size
    * Return: *\<Integer\>*
* **addTrack(track)** - Add a track to the tracks list
    * **track** *\<Track\>* - Track
* **videoTrack()** - Get the first video track
    * Return: *\<VideoTrack\>*
* **audioTrack()** - Get the first audio track
    * Return: *\<AudioTrack\>*
* **samples()** - Get a list of movie samples ordered by relative timestamp
    * Return: *\<Array\>*
* **ensureDuration()** - Calculate and set duration based on the track durations (only if duration is zero)
    * Return: *\<Number\>*

### FragmentList

A list of movie fragments class.

```javascript
const FragmentList = require('node-video-lib').FragmentList
```

Properties:

* **fragmentDuration** *\<Integer\>* - Target fragment duration
* **duration** *\<Integer\>* - Movie duration
* **timescale** *\<Integer\>* - Movie timescale
* **video** *\<Object\>* - Video info
    * **timescale** *\<Integer\>* - Video timescale
    * **codec** *\<String\>* - Codec string
    * **extraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Video codec information
    * **size** *\<Integer\>* - Video samples size
    * **width** *\<Integer\>* - Video width
    * **height** *\<Integer\>* - Video height
* **audio** *\<Object\>* - Audio info
    * **timescale** *\<Integer\>* - Audio timescale
    * **codec** *\<String\>* - Codec string
    * **extraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Audio codec information
    * **size** *\<Integer\>* - Audio samples size

Methods:

* **relativeDuration()** - Movie duration in seconds
    * Return: *\<Number\>*
* **count()** - Fragments count
    * Return: *\<Integer\>*
* **size()** - Samples size
    * Return: *\<Integer\>*
* **get(index)** - Get fragment by index
    * Return: [*\<Fragment\>*](#fragment)

### Fragment

A movie fragment class

```javascript
const Fragment = require('node-video-lib').Fragment
```

Properties:

* **timestamp** *\<Integer\>* - Fragment timestamp
* **duration** *\<Integer\>* - Fragment duration
* **timescale** *\<Integer\>* - Fragment timescale
* **videoExtraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Video codec information
* **audioExtraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Audio codec information
* **samples** *\<Array\>* - List of fragment samples

Methods:

* **relativeTimestamp()** - Fragment timestamp in seconds
    * Return: *\<Number\>*
* **relativeDuration()** - Fragment duration in seconds
    * Return: *\<Number\>*
* **hasVideo()** - Fragment has a video track
    * Return: *\<Boolean\>*
* **hasAudio()** - Fragment has an audio track
    * Return: *\<Boolean\>*

### Track

A general track class

```javascript
const Track = require('node-video-lib').Track
```

Properties:

* **duration** *\<Integer\>* - Track duration
* **timescale** *\<Integer\>* - Track timescale
* **codec** *\<String\>* - Codec string
* **extraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Codec information
* **samples** *\<Array\>* - List of track samples

Methods:

* **relativeDuration()** - Track duration in seconds
    * Return: *\<Number\>*
* **ensureDuration()** - Calculate and set duration based on the sample durations (only if duration is zero)
    * Return: *\<Number\>*
* **size()** - Samples size
    * Return: *\<Integer\>*

### AudioTrack

An audio track class. Extends the general track class

```javascript
const AudioTrack = require('node-video-lib').AudioTrack
```

Properties:

* **channels** *\<Integer\>* - Number of audio channels
* **sampleRate** *\<Integer\>* - Audio sample rate
* **sampleSize** *\<Integer\>* - Audio sample size

### VideoTrack

A video track class. Extends the general track class

```javascript
const VideoTrack = require('node-video-lib').VideoTrack
```

Properties:

* **width** *\<Integer\>* - Video width
* **height** *\<Integer\>* - Video height

Methods:

* **resolution()** - Video resolution
    * Return: *\<String\>*

### Sample

A general video sample class

```javascript
const Sample = require('node-video-lib').Sample
```

Properties:

* **timestamp** *\<Integer\>* - Sample timestamp
* **timescale** *\<Integer\>* - Sample timescale
* **size** *\<Integer\>* - Sample size
* **offset** *\<Integer\>* - Sample offset in the file

Methods:

* **relativeTimestamp()** - Sample timestamp in seconds
    * Return: *\<Number\>*

### AudioSample

An audio sample class. Extends the general sample class

```javascript
const AudioSample = require('node-video-lib').AudioSample
```

### VideoSample

A video sample class. Extends the general sample class

```javascript
const VideoSample = require('node-video-lib').VideoSample
```

Properties:

* **compositionOffset** *\<Integer\>* - Composition offset
* **keyframe** *\<Boolean\>* - Keyframe flag
