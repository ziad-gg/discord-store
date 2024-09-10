const { Client } = require('./src');
require('dotenv').config();

const client = new Client(process.env.TOKEN, process.env.GUILDID);

async function main() {
    const build = await client.init();

    console.log(`Connected with ${build.client.name} to ${build.guild.name}`);

    const video = 'dump/Dumo.mp4';
    const output = 'output.mp4';
    
    const id = await client.document.write(video, {
        cb: progress,
        name: output,
    });

    function progress(chunks, current, done) {
        const percentage = (current / chunks) * 100;
        console.log(`Progress: ${percentage.toFixed(2)}%, completed: ${done}`);
    };

    const chunksLength = await client.document.read(id);
    console.log(chunksLength);
};

main();