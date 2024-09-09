const db = require('djs.db/lib');

const groups = new db.Schema({
    id: { type: 'string', key: true, required: true },
    robux: { type: 'number', required: true },
    membersCount: { type: 'number', required: true },
    isLocked: { type: 'boolean', required: true },
    publicEntryAllowed: { type: 'boolean', required: true },
})

async function main() {
    const client = new db.Client('MTI0NTcyMTk1OTYwNjc4NDA0MA.G7N4iv.YCMYRocngIkiabgcu1QL3j0CtgBAwFFQsWKhL8', '1238423780297150474');
    await client.init();

    const fill = await groups.fill({
        id: '1',
        robux: 1000000,
        membersCount: 1000,
        isLocked: true,
        publicEntryAllowed: true,
    }, client).save();

    console.log(fill);
}

main();