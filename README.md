# Welcome

```js
   const { Client, Schema } = require('djs.db');

    const client = new Client('BOT_TOKEN', 'GUILD_ID');
    await client.init();

    const users = new Schema({
        name: { type: 'string', key: true, required: true },
        age: { type: 'number', key: false, required: false },
        isStudent: { type: 'boolean', key: false, required: false }
    });

    const data = await users.fill({
        name: 'ziad',
        age: 25,
        isStudent: true
    }, client).save();

    console.log(data);

    const item = await client.findFirst({ name: 'ziad' }).fetch();
    console.log(item);

    const items = client.findMany({ name: 'ziad' });
    console.log(items);

    // client.delete('ziad');
    // client.deleteAll();
```