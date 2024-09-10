# Welcome

## What is djs.db ?
- It is a easy and quick storage unit that relies on `objects` to store data in **JSON** format

## Installation
- You need to install the package on your project
```sh-session
npm install djs.db
yarn add djs.db
```

```js
const { Client } = require('djs.db');
require('dotenv').config();

const client = new Client(process.env.TOKEN, process.env.GUILDID);

async function main() {
    await client.init();

    const video = 'video.mp4';
    const output = 'output.mp4';

    console.time('Video upload');
    // write(filePath, ChunkSize); // maximum chunk size is 25 and minumum is 5 deafult is 24
    const id = await client.document.write(video);
    console.timeEnd('Video upload');

    console.time('Video download');
    // read(id, outPutPath, chunkIndex) // chunk index is -1 by deafult which will download all chunks
    await client.document.read(id, output, 0);
    console.timeEnd('Video download');
};

main();
```