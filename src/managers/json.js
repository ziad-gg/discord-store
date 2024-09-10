const discord = require('discord.js');

class JSON_STORE {
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
            const messages = await channel.messages.fetch({ limit: JSON_STORE.MAX_MESSAGES, cache: false });
            if (messages.length != JSON_STORE.MAX_MESSAGES) this.#valid.push(channel.id);
        };

        if (this.#valid.length == 0) {
            const channel = await guild.channels.create({
                name: 'store',
                type: discord.ChannelType.GuildText,
                parent: this.categoryId,
            });

            this.#valid.push(channel.id);
        };

        // console.log(this.#valid);
    };

    read() {

    }

    write() {

    }

}

module.exports = JSON_STORE;