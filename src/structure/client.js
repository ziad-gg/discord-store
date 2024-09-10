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

        await this.#build();

        return {
            guild: {
                name: this.#guild.name,
                id: this.#guild.id,
            },
            client: {
                name: this.client.user.username,
                id: this.client.user.id,
            },
            guildId: this.#guild.id,
            clientId: this.client.user.id,
        }
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
        const document = new DOCUMENT_STORE(this.client, guild, documentStore.id);
        await document.init();

        this.document = document;
    };

}

module.exports = Client;