const discord = require('discord.js');
const Compresion = require('../utils/compresion.js');

class Client {
    #cache;
    constructor(token, id = null) {
        this.client = new discord.Client({
            intents: 3276799
        });

        if (!token) throw new Error('Missing token')

        this.token = token;
        this.serverId = id;
    }

    async init() {
        await this.client.login(this.token);
        this.#cache = [];

        if (this.serverId) {
            const guild = this.client.guilds.cache.get(this.serverId);
            if (!guild) throw new Error(`Server with ID ${this.serverId} not found`);
            this.guild = guild;

            const channels = await this.guild.channels.fetch();

            channels.forEach((channel) => {
                if (!channel.topic) return;

                try {
                    const data = Compresion.decompress(channel.topic);

                    this.#cache.push({
                        channelId: channel.id,
                        ...data
                    });

                } catch { };
            });

            console.log(`Connected to (${guild.id})`);
        } else {
            this.guild = await this.client.guilds.create({
                name: 'AutoModBot',
                region: 'us-central',
            });

            this.serverId = this.guild.id;

            console.log(`Connected to (${this.guild.id})`);
        }
    }

    async createChannel() {
        const channel = await this.guild.channels.create({
            name: `automod-${Math.random() * 10000}`,
            type: discord.ChannelType.GuildText,
            topic: 'Automatically moderating the channel',
            reason: 'To prevent inappropriate content',
        });

        return channel;
    }

    async invite() {
        const invite = await this.guild.invites.create(this.channel);
        return invite;
    }

    async save(payload) {
        if (!payload.topic || !payload.chunk || !payload.id) throw new Error('Please provide a topic and a chunk');

        const channel = await this.guild.channels.create({
            name: payload.id,
            type: discord.ChannelType.GuildText,
            topic: payload.topic,
            reason: 'To prevent inappropriate content',
        });

        this.#cache.push({
            ...Compresion.decompress(payload.topic),
            channelId: channel.id,
        });

        await channel.send({ content: payload.chunk });
    }

    /**
    * Finds the first object in the cache that matches the query.
    * @param {Object} query - The query object to search for.
    * @returns {Object|null} - The matching object or null if not found.
    */
    findFirst(query) {
        if (!query || typeof query !== 'object') {
            throw new Error('Please provide a query');
        }

        const result = this.#cache.find(item => {
            return Object.keys(query).every(key => item[key] === query[key]);
        });

        return {
            ...(result ? result : {}),
            fetch: () => {
                return new Promise(async (resolve, reject) => {
                    if (!result) return resolve(null);

                    const channel = this.guild.channels.cache.get(result.channelId);
                    const messages = await channel.messages.fetch(true);

                    messages.forEach(message => {
                        if (message.author.id !== this.client.user.id) return

                        try {
                            const data = Compresion.decompress(message.content);
                            resolve({
                                __uuid: result.__uuid,
                                ...data
                            });
                        } catch { }
                    });
                });
            }
        };

    }

    findMany(query) {
        if (!query || typeof query !== 'object') {
            throw new Error('Please provide a query');
        }

        const results = this.#cache.filter(item => {
            return Object.keys(query).every(key => item[key] === query[key]);
        });

        return results;
    }

    async deleteAll() {
        this.#cache = [];
        await this.guild.delete();
    }
}

async function test() {
    const Schema = require('./schema.js');

    const c = new Client('', '1282514503908589568');
    await c.init();

    const users = new Schema({
        name: { type: 'string', key: true, required: true },
        age: { type: 'number', key: false, required: false },
        isStudent: { type: 'boolean', key: false, required: false }
    });

    const data = await users.fill({
        name: 'ziad',
        age: 25,
        isStudent: true
    }, c).save();

    console.log(data);

    const item = await c.findFirst({ name: 'ziad' }).fetch();
    console.log(item);

    const items = c.findMany({ name: 'ziad' });
    console.log(items);
}

test();

module.exports = Client;