const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const compress = function (data) {
    const gzipBuffer = zlib.gzipSync(data);

    const compressedString = gzipBuffer.toString('base64');
    return compressedString;
};

const decompress = function (compressedData) {
    const buffer = Buffer.from(compressedData, 'base64');
    const decompressedBuffer = zlib.gunzipSync(buffer);
    return decompressedBuffer;
};

function chunkFile(filePath) {
    const chunkSize = 25 * 1024 * 1024; // 25 MB
    const fileStats = fs.statSync(filePath); // Get file size
    const totalSize = fileStats.size;
    let start = 0;
    let chunkIndex = 0;

    const readStream = fs.createReadStream(filePath, { highWaterMark: chunkSize });

    readStream.on('data', (chunk) => {
        const chunkPath = path.join(__dirname, `chunk_${chunkIndex}.part`);
        fs.writeFileSync(chunkPath, compress(chunk)); 
        console.log(`Chunk ${chunkIndex + 1}: ${chunk.length} bytes written to ${chunkPath}`);
        chunkIndex++;
    });

    readStream.on('end', () => {
        console.log('File has been successfully split into chunks.');
    });

    readStream.on('error', (err) => {
        console.error('Error reading the file:', err);
    });
}

function recollectFile(outputFilePath, numberOfChunks) {
    const writeStream = fs.createWriteStream(outputFilePath);

    for (let chunkIndex = 0; chunkIndex < numberOfChunks; chunkIndex++) {
        const chunkPath = path.join(__dirname, `chunk_${chunkIndex}.part`);
        const compressedChunk = fs.readFileSync(chunkPath, 'utf-8');
        const decompressedChunk = decompress(compressedChunk);

        writeStream.write(decompressedChunk);
        console.log(`Recollecting chunk ${chunkIndex + 1}`);
    }

    writeStream.end(() => {
        console.log(`File has been successfully reassembled into ${outputFilePath}`);
    });
}

const numberOfChunks = 4; // Replace with actual number of chunks
const outputFilePath = './recollected_largefile.zip';
recollectFile(outputFilePath, numberOfChunks);

// const filePath = './largefile.zip'; // Replace with your file path
// chunkFile(filePath);
