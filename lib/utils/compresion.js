const zlib = require('zlib');

module.exports.compress = function (json) {
    const stringJson = JSON.stringify(json);
    const gzipBuffer = zlib.gzipSync(stringJson);

    const compressedString = gzipBuffer.toString('base64');
    return compressedString;
};

module.exports.decompress = function (compressedString) {
    const buffer = Buffer.from(compressedString, 'base64');
    const gzipBuffer = zlib.gunzipSync(buffer);
    const stringJson = gzipBuffer.toString('utf8');

    const json = JSON.parse(stringJson);
    return json;
}