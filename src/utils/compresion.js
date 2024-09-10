const zlib = require('zlib');

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = ALPHABET.length;

module.exports.compressJSON = function (json) {
    const stringJson = JSON.stringify(json);
    const gzipBuffer = zlib.gzipSync(stringJson);

    const compressedString = gzipBuffer.toString('base64');
    return compressedString;
};

module.exports.compress = function (data) {
    const gzipBuffer = zlib.gzipSync(data, {
        level: 1
    });

    const compressedString = gzipBuffer.toString('base64');
    return compressedString;
};

module.exports.decompress = function (compressedData) {
    const buffer = Buffer.from(compressedData, 'base64');
    const decompressedBuffer = zlib.gunzipSync(buffer);
    return decompressedBuffer;
};


module.exports.decompressJSON = function (compressedString) {
    const buffer = Buffer.from(compressedString, 'base64');
    const gzipBuffer = zlib.gunzipSync(buffer);
    const stringJson = gzipBuffer.toString('utf8');

    const json = JSON.parse(stringJson);
    return json;
}

module.exports.encodeBase62 = function (num) {
    let encoded = '';
    let n = BigInt(num);
    while (n > 0n) {
        encoded = ALPHABET[n % BigInt(BASE)] + encoded;
        n = n / BigInt(BASE);
    }
    return encoded || '0';
};

module.exports.decodeBase62 = function (str) {
    let decoded = 0n;
    for (let i = 0; i < str.length; i++) {
        decoded = decoded * BigInt(BASE) + BigInt(ALPHABET.indexOf(str[i]));
    }
    return decoded.toString();
}