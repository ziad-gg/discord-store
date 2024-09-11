const { Client } = require('./src');
require('dotenv').config();

const client = new Client(process.env.TOKEN, process.env.GUILDID);

async function main() {
    const build = await client.init();

    console.log(`Connected with ${build.client.name} to ${build.guild.name}`);

    const video = 'dump/Dumo.mp4';
    const output = 'video.mp4';

    const id = await client.document.write(video, {
        cb: progress,
        name: output,
        size: 25
    });

    console.log(id);

    function progress(chunks, current, done) {
        const percentage = (current / chunks) * 100;
        console.log(`Progress: ${percentage.toFixed(2)}%, completed: ${done} (${current}/${chunks})`);
    };

    const chunksLength = await client.document.read(id, 0);

    setTimeout(async () => {
        console.log('download chunk 2');
        await client.document.read(id, 2);
        console.log('chunk 2 downloaded');
    }, 7000);

    console.log(chunksLength);
};

main();