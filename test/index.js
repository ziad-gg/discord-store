const zlib = require('zlib');

const jsonData = {
    "name": "ziad",
    "version": "1.0.0",
    "description": "A simple REST API for managing a library system",
    "fakedata": true,
    "more": true,
    "scripts": {
        "start": "node server.js"
    },
    "author": "ziad",
    "license": "ISC",
    "dependencies": {
        "dotenv": "^10.0.0",
        "express": "^4.17.1",
        "faker": "^5.5.3",
        "jsonwebtoken": "^8.5.1",
        "mongoose": "^5.13.2"
    },
    "devDependencies": {
        "chai": "^4.3.4",
        "mocha": "^8.4.0",
        "nodemon": "^2.0.12"
    },
    "main": "server.js",
    "repository": {
        "type": "git",
        "url": "git+https://github.com/ziadalquraishi/library-api.git"
    },
    "bugs": {
        "url": "https://github.com/ziadalquraishi/library-api/issues"
    },
    "homepage": "https://github.com/ziadalquraishi/library-api#readme",
    "keywords": [
        "library",
        "api",
        "rest",
        "node.js",
        "express",
        "mongoose",
        "jwt",
        "fakedata"
    ]
};

// Convert JSON to string
const jsonString = JSON.stringify(jsonData);

// Compress JSON string
zlib.gzip(jsonString, (err, buffer) => {
    if (err) {
        console.error('Error during compression:', err);
        return;
    }

    // Convert buffer to base64 string
    const compressedString = buffer.toString('base64');
    console.log('Compressed string:', compressedString);

    zlib.gunzip(buffer, (err, decompressedBuffer) => {
        if (err) {
            console.error('Error during decompression:', err);
            return;
        }

        // Convert buffer to JSON string
        const jsonString = decompressedBuffer.toString('utf-8');
        const jsonData = JSON.parse(jsonString);

        console.log('Decompressed JSON data:', jsonData);
    });
});
