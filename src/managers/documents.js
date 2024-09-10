const discord = require('discord.js');
const { default: axios } = require('axios');
const fs = require('fs');

const { compress, decompress, encodeBase62, decodeBase62 } = require('../utils/compresion.js');

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

    async read(id, output, chunk = -1) {
        const [guildId, channelId, messageId, customId] = id.split('-').map(decodeBase62);

        if (!guildId || !channelId || !messageId || !customId) {
            throw new Error('Invalid guild read parameters');
        }

        if (!output) {
            throw new Error('Output file path required');
        }

        !fs.existsSync(output) && fs.writeFileSync(output, '');

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

        for (let message of messages.values()) {
            if (!message.content.includes(customId)) continue;

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

        const writeStream = fs.createWriteStream(output, { flags: 'a' });

        downloadedChunks.forEach(chunk => {
            writeStream.write(chunk.data);
        });

        writeStream.end();

        return chunks.length;
    }

    write(filePath, size = 24) {

        if (isNaN(size) || size > 25 || size < 5) throw new Error(`Maximum chunk size 25 & min: 5`);

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
                const attach = new discord.AttachmentBuilder(buffer, { name: `chunk-${chunks.length}.part` });
                chunks.push(attach);
            });

            let firstMessage = null;

            readStream.on('end', async () => {
                const channel = await this.#getChannelWithRoom(chunks.length);
                const requests = [];

                for (const chunk of chunks) {
                    if (!firstMessage) {
                        const m = await channel.send({
                            content: `${id}-${chunk.name}`,
                            files: [chunk]
                        });

                        firstMessage = m;
                    } else {
                        requests.push(channel.send({
                            content: `${id}-${chunk.name}`,
                            files: [chunk],
                        }));
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