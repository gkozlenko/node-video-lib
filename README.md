# node-video-lib

[![Build Status](https://travis-ci.org/pipll/node-video-lib.svg?branch=master)](https://travis-ci.org/pipll/node-video-lib) [![npm](https://img.shields.io/npm/v/node-video-lib.svg)](https://www.npmjs.com/package/node-video-lib) [![Code Climate](https://codeclimate.com/github/pipll/node-video-lib/badges/gpa.svg)](https://codeclimate.com/github/pipll/node-video-lib) ![GitHub license](https://img.shields.io/github/license/pipll/node-video-lib.svg)

Node.js Video Library.

## Limitations

**This library works only with MP4 video files encoded using H.264 video codec and AAC audio codec.** 

## Installation

```
npm install node-video-lib
```

## Usage

### Parse MP4 file

```javascript
const fs = require('fs');
const VideoLib = require('node-video-lib');

fs.open('/path/to/file.mp4', 'r', function(err, fd) {
    try {
        let movie = VideoLib.MP4Parser.parse(fd);
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
const VideoLib = require('node-video-lib');

fs.open('/path/to/file.mp4', 'r', function(err, fd) {
    try {
        let movie = VideoLib.MP4Parser.parse(fd);
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
        fs.close(fd);
    }
});
```

### Create index file

```javascript
const fs = require('fs');
const VideoLib = require('node-video-lib');

fs.open('/path/to/file.mp4', 'r', function(err, fd) {
    try {
        let movie = VideoLib.MP4Parser.parse(fd);
        let fragmentList = VideoLib.FragmentListBuilder.build(movie, 5);
        fs.open('/path/to/index.idx', 'w', function(err, fdi) {
            try {
                VideoLib.FragmentListIndexer.index(fragmentList, fdi);
            } catch (ex) {
                console.error('Error:', ex);
            } finally {
                fs.close(fdi);
            }
        });
    } catch (ex) {
        console.error('Error:', ex);
    } finally {
        fs.close(fd);
    }
});
```

### Create MPEG-TS chunks using index file

```javascript
const fs = require('fs');
const VideoLib = require('node-video-lib');

fs.open('/path/to/file.mp4', 'r', function(err, fd) {
    fs.open('/path/to/index.idx', 'r', function(err, fdi) {
        try {
            let fragmentList = VideoLib.FragmentListIndexer.read(fdi);
            for (let i = 0; i < fragmentList.count(); i++) {
                let fragment = fragmentList.get(i);
                let sampleBuffers = VideoLib.FragmentReader.readSamples(fragment, fd);
                let buffer = VideoLib.HLSPacketizer.packetize(fragment, sampleBuffers);
                // Now buffer contains MPEG-TS chunk
            }
        } catch (ex) {
            console.error('Error:', ex);
        } finally {
            fs.close(fd);
            fs.close(fdi);
        }
    });
});
```

## Classes

### MP4Parser

A tool for parsing MP4 video files.

```javascript
const MP4Parser = require('node-video-lib').MP4Parser
```

Methods:

* **parse(source)** - Parse MP4 file
    * **source** *\<Integer\>*|[*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Source (File descriptor or Buffer)
    * Return: [*\<Movie\>*](#movie)

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
    * **movie** [*\<Movie\>*](#movie) - Fragment duration
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
* **addTrack(track)** - Add a track to the tracks list
    * **track** *\<Track\>* - Track
* **videoTrack()** - Get the first video track
    * Return: *\<VideoTrack\>*
* **audioTrack()** - Get the first audio track
    * Return: *\<AudioTrack\>*
* **samples()** - Get a list of movie samples ordered by relative timestamp
    * Return: *\<Array\>*

### FragmentList

A list of movie fragments class.

```javascript
const FragmentList = require('node-video-lib').FragmentList
```

Properties:

* **fragmentDuration** *\<Integer\>* - Target fragment duration
* **duration** *\<Integer\>* - Movie duration
* **timescale** *\<Integer\>* - Movie timescale
* **videoExtraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Video codec information content
* **audioExtraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Audio codec information content
* **width** *\<Integer\>* - Video width
* **height** *\<Integer\>* - Video height

Methods:

* **relativeDuration()** - Movie duration in seconds
    * Return: *\<Number\>*
* **resolution()** - Video resolution
    * Return: *\<String\>*
* **count()** - Fragments count
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
* **videoExtraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Video codec information content
* **audioExtraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Audio codec information content
* **samples** *\<Array\>* - List of fragment samples

Methods:

* **relativeTimestamp()** - Fragment timestamp in seconds
    * Return: *\<Number\>*
* **relativeDuration()** - Fragment duration in seconds
    * Return: *\<Number\>*

### Track

A general track class

```javascript
const Track = require('node-video-lib').Track
```

Properties:

* **duration** *\<Integer\>* - Track duration
* **timescale** *\<Integer\>* - Track timescale
* **extraData** [*\<Buffer\>*](https://nodejs.org/api/buffer.html) - Codec information content
* **samples** *\<Array\>* - List of track samples

Methods:

* **relativeDuration()** - Track duration in seconds
    * Return: *\<Number\>*

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
