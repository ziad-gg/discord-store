const discord = require('discord.js');
const Compresion = require('../utils/compresion.js');
const JSON_STORE = require('../managers/json.js');
const DOCUMENT_STORE = require('../managers/documents.js');

class Client {
    #guildId;
    #token;
    /** @type {discord.Guild} */
    #guild;
    /** @type {{ documentId: string, jsonId: string }} */
    #buildConfig

    static STORES = {
        JSON_STORE: 'JSON-STORE',
        DOCUMENT_STORE: 'DOCUMENT-STORE'
    };

    constructor(token, guildId = null) {
        this.client = new discord.Client({
            intents: 3276799,
        });

        if (!token) throw new Error('Missing token')

        this.#token = token;
        this.#guildId = guildId;
    }

    async init() {
        await this.client.login(this.#token);

        if (this.#guildId) {
            const guild = await this.client.guilds.fetch(this.#guildId);
            if (!guild) throw new Error(`Server with ID ${this.#guildId} not found`);
            this.#guild = guild;
        } else {
            this.#guild = await this.client.guilds.create({
                name: 'Discord Drive',
                region: 'us-central',
            });
        }

        console.log(this.#guild.id);
        await this.#build();
    }

    async #build() {
        const guild = this.#guild;

        const channels = await guild.channels.fetch();

        const jsonStore = channels.find(c => c.name == Client.STORES.JSON_STORE) ??
            await guild.channels.create({ name: Client.STORES.JSON_STORE, type: discord.ChannelType.GuildCategory });

        const documentStore = channels.find(c => c.name == Client.STORES.DOCUMENT_STORE) ??
            await guild.channels.create({ name: Client.STORES.DOCUMENT_STORE, type: discord.ChannelType.GuildCategory });

        const buildConfig = {
            documentId: documentStore.id,
            jsonId: jsonStore.id,
        };

        this.#buildConfig = buildConfig;

        const json = new JSON_STORE(this.client, guild, jsonStore.id);
        // await json.init();
        const document = new DOCUMENT_STORE(this.client, guild, documentStore.id);
        await document.init();

        this.document = document;

        // const id = '1ttZD8xz438-1wLrgWBTF3j-1wLv3hVb1Zh-23uLuIgNeYh';
        // console.time('read');
        // await document.read(id);
        // console.timeEnd('read');
        // // console.time('Uploading 20MB');
        // // const upload = await document.write('dump/7MB.png');
        // // console.log(upload);
        // // console.timeEnd('Uploading 20MB');
    };

}

module.exports = Client;