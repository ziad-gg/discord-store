# Welcome

## What is djs.db ?
- It is a easy and quick storage unit that relies on `objects` to store data in **JSON** format

## Installation
- You need to install the package on your project
```sh-session
npm install djs.db
yarn add djs.db
```

# Uploading files

```js
const { Client } = require('djs.db');
require('dotenv').config();

const client = new Client(process.env.TOKEN, process.env.GUILDID);

async function main() {
    const build = await client.init();

    console.log(`Connected with ${build.clinet.name} to ${build.guild.name}`);

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
```