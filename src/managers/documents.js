const discord = require('discord.js');
const { default: axios } = require('axios');
const fs = require('fs');

const { encodeBase62, decodeBase62 } = require('../utils/compresion.js');

class DOCUMENT_STORE {
    static MAX_MESSAGES = 100;

    #valid
    /** @type {discord.Client} */
    #client
    /** @type {discord.Guild} */
    #guild
    constructor(client, guild, categoryId) {
        this.#client = client;
        this.#guild = guild;
        this.#valid = [];

        this.categoryId = categoryId;
    }

    async init() {
        const guild = this.#guild;

        const channels = (await guild.channels.fetch()).filter(c => c.parentId == this.categoryId);

        for (const channel of channels.values()) {
            const messages = await channel.messages.fetch({ limit: DOCUMENT_STORE.MAX_MESSAGES, cache: false });
            let FREE = DOCUMENT_STORE.MAX_MESSAGES - messages.size;

            if (FREE > 0) this.#valid.push([channel.id, FREE]);
        };

        if (this.#valid.length == 0) {
            const channel = await guild.channels.create({
                name: 'store',
                type: discord.ChannelType.GuildText,
                parent: this.categoryId,
            });

            this.#valid.push([channel.id, DOCUMENT_STORE.MAX_MESSAGES]);
        };

        // console.log(this.#valid);
    };

    async #getChannelWithRoom(room) {
        /** @type {discord.GuildChannel} */
        let channel = this.#valid.find(d => d[1] >= room);

        if (!channel) {
            channel = await this.#guild.channels.create({
                name: 'store',
                type: discord.ChannelType.GuildText,
                parent: this.categoryId,
            });

            this.#valid.push([channel.id, DOCUMENT_STORE.MAX_MESSAGES - room]);

            return channel;
        } else {
            const c = await this.#guild.channels.fetch(channel[0]);
            const index = this.#valid.findIndex(e => e[0] == c.id);

            this.#valid[index][1] = channel[1] - room;
            return c;
        }
    }

    async read(id, chunk = -1, output = undefined) {
        const [guildId, channelId, messageId, customId] = id.split('-').map(decodeBase62);

        if (!guildId || !channelId || !messageId || !customId) {
            throw new Error('Invalid guild read parameters');
        }

        const channel = await this.#guild.channels.fetch(channelId).catch(error => {
            console.error('Error fetching channel:', error);
            return null;
        });

        if (!channel) return;

        const messages = await channel.messages.fetch({ limit: DOCUMENT_STORE.MAX_MESSAGES, cache: false, around: messageId }).catch(error => {
            console.error('Error fetching messages:', error);
            return [];
        });

        const chunks = [];

        let name = null; // return

        for (let message of messages.values()) {
            if (!message.content.includes(customId)) continue;
            output = output ?? message.content.split('-')[1];
            name = message.content.split('-')[1];

            const attachment = message.attachments.first();
            if (attachment) {
                chunks.push({
                    name: attachment.name,
                    url: attachment.url,
                    size: attachment.size,
                    order: +attachment.name.split('-')[1].split('.')[0]
                });
            }
        }

        chunks.sort((a, b) => a.order - b.order);

        const chunksToDownload = chunk === -1 ? chunks : [chunks[chunk]];
        if (!chunksToDownload || !chunksToDownload?.[0]) throw new Error('Missing chunks to download');

        const downloadPromises = chunksToDownload.map(async (chunk) => {
            return axios.get(chunk.url, { responseType: 'arraybuffer' })
                .then(response => ({
                    ...chunk,
                    data: response.data
                }))
                .catch(error => {
                    console.error(`Error downloading chunk ${chunk.order}:`, error);
                    return null;
                });
        });

        const downloadedChunks = (await Promise.all(downloadPromises)).filter(chunk => chunk !== null);

        if (downloadedChunks.length === 0) {
            throw new Error(`No chunks were successfully downloaded.`)
        }

        if (!fs.existsSync(output)) fs.writeFileSync(output, '');

        const writeStream = fs.createWriteStream(output, { flags: 'a' });

        downloadedChunks.forEach(chunk => {
            writeStream.write(chunk.data);
        });

        writeStream.end();

        return {
            total: chunk == -1 ? chunks.length : chunk,
            chunks: chunks.length,
            name
        };
    }

    write(filePath, options = { size: 24, cb: undefined, name: 'output' }) {
        const size = options?.size || 24;
        const cp = options?.cb;
        const name = options?.name;

        if (!filePath) throw new Error(`File path is required`);
        if (!size || isNaN(size) || size < 5 || size > 25) throw new Error(`Maximum chunk size 25 & min: 5`);
        if (!name || typeof name != 'string') throw new Error('File must have a name');
        if (name.includes('-')) throw new Error('invalid file name remove any -');

        return new Promise((resolve, reject) => {
            const id = BigInt.asUintN(64, BigInt(Date.now()) * 1_000_000n + BigInt(Math.floor(Math.random() * 1_000_000))).toString();

            const file = fs.existsSync(filePath);
            if (!file) throw new Error(`File not found: ${filePath}`);

            const chunkSize = size * 1024 * 1024;

            /** @type {Array<discord.AttachmentBuilder>} */
            let chunks = [];

            const readStream = fs.createReadStream(filePath, { highWaterMark: chunkSize });

            readStream.on('data', (chunk) => {
                const buffer = Buffer.from(chunk);
                const attach = new discord.AttachmentBuilder(buffer, { name: `${name}-${chunks.length}.part` });
                chunks.push(attach);
            });

            let firstMessage = null;

            readStream.on('end', async () => {
                if (chunks.length > DOCUMENT_STORE.MAX_MESSAGES) throw new Error(`File is too large`);
                (cp && typeof cp == 'function') && cp(chunks.length, 0, false);

                const channel = await this.#getChannelWithRoom(chunks.length);
                const requests = [];

                const send = async (chunk) => {
                    const m = await channel.send({
                        content: `${id}-${chunk.name}`,
                        files: [chunk]
                    });

                    const chunkOrder = (+chunk.name.split('-')[1].split('.')[0]) + 1;
                    (cp && typeof cp == 'function') && cp(chunks.length, chunkOrder, chunks.length == chunkOrder);

                    return m;
                };

                for (const chunk of chunks) {
                    if (!firstMessage) {
                        const m = await send(chunk);
                        firstMessage = m;
                    } else {
                        requests.push(send(chunk));
                    }
                };

                await Promise.all(requests);

                const path = `${this.#guild.id}-${channel.id}-${firstMessage.id}-${id}`;
                const compressed = path.split('-').map(encodeBase62).join('-');

                resolve(compressed);
            });
        });
    }

}

module.exports = DOCUMENT_STORE;