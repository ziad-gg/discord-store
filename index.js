const { Client } = require('./src');
require('dotenv').config();

const client = new Client(process.env.TOKEN, process.env.GUILDID);

async function main() {
    const build = await client.init();

    console.log(`Connected with ${build.client.name} to ${build.guild.name}`);


    const video = 'dump/7MB.png';
    const output = 'image.png';

    const id = await client.document.write(video, {
        cb: progress,
        name: output,
        size: 25
    });

    function progress(chunks, current, done) {
        const percentage = (current / chunks) * 100;
        console.log(`Progress: ${percentage.toFixed(2)}%, completed: ${done} (${current}/${chunks})`);
    };

    const chunksLength = await client.document.read(id);
    console.log(chunksLength);
};

main();