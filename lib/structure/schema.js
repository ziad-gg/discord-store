const Client = require('./client.js');
const Compresion = require('../utils/compresion.js');
const { v4: uuid } = require('uuid');

class Schema {
    static validationSchema = {
        type: ['string', 'number', 'boolean'],
        key: [true, false],
        required: [true, false]
    };

    constructor(options) {
        if (typeof options !== 'object') throw new TypeError('options must be an object');

        this.structure = {};

        Object.keys(options).forEach(field => {
            if (typeof options[field] !== 'object') throw new TypeError(`options[${field}] must be an object`);
            if (Object.keys(options[field]).length <= 0 || !options[field]['type']) throw new Error(`options[${field}] must have at least one field`);

            Object.keys(options[field]).forEach(key => {
                if (!Schema.validationSchema[key]) throw new Error(`Invalid schema option: ${key}`);

                if (!Schema.validationSchema[key].includes(options[field][key]))
                    throw new TypeError(`Invalid value for ${field}.${key}: ${options[field][key]}`);

                this.structure[field] = this.structure[field] || {};
                this.structure[field][key] = options[field][key];
            });

        });

        // console.log(this.structure);
    }

    /**
     * @param {{}} data 
     * @param {Client} client 
     * @returns {{ data: {}, save: () => Promise<{}> }}
     */
    fill(data, client) {
        if (!client || !client.serverId) throw new Error('Missing Client');
        if (typeof data !== 'object') throw new TypeError('data must be an object');

        Object.keys(this.structure).forEach(field => {

            if (!data[field] && this.structure[field].required) {
                throw new Error(`Missing required field: ${field}`)
            } else if (!data[field] && !this.structure[field].required) {
                return
            };

            if (typeof data[field] != this.structure[field].type) throw new TypeError(`Invalid data[${field}] type [${typeof data[field]}]`);
        });

        // console.log(data);
        return { data, save: this.#save(data, client) };
    }

    #save(data, client) {
        const structure = this.structure;

        return async function () {
            const totalData = Compresion.compress(data);
            const _uuid = uuid();

            let keys = {
                __uuid: _uuid,
            };
            
            Object.keys(structure).forEach(key => {
                if (structure[key].key) keys[key] = data[key]
            });

            keys = Compresion.compress(keys);

            const payload = {
                chunk: totalData,
                topic: keys,
                id: _uuid
            };

            await client.save(payload);

            return data;
        }
    }
};

module.exports = Schema;