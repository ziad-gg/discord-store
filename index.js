const { Client } = require('./src');
require('dotenv').config();
const fs = require('fs');

const client = new Client(process.env.TOKEN, process.env.GUILDID);

async function main() {
    await client.init();

    const video = 'dump/Dumo.mp4';
    const output = 'output.mp4';

    // console.time('Video upload');
    // const id = await client.document.write(video);
    // console.log(id);
    // console.timeEnd('Video upload');
    const id = '1ttZD8xz438-1wLrgWBTF3j-1wLysiZ4OJb-23uMiXoIxwA';

    fs.existsSync(output) && fs.unlinkSync(output);

    const chunksLength = await client.document.read(id, output, -1);
    console.log(chunksLength);

    // let index = 1;

    // setInterval(async () => {
    //     console.log('putting chunk ', index);
    //     await client.document.read(id, output, index);
    //     index = index + 1;
    // }, 5000);
};

main();