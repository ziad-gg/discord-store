import { Client as djsClient } from "discord.js";

declare module "djs.db" {
    class Client {
        constructor(token: string, guildId?: string);

        public init(): Promise<void>
        public findFirst(query: {}): { [key: string]: any, fetch: () => Promise<{}> }
        public findMany(query: {}): { [key: string]: any }
        public delete(query: {}): Promise<true | null>
        public deleteAll(): Promise<null>
    }

    class Schema {
        constructor (options: {});
        public fill(data: {}, client: Client): { data: {}, save: () => Promise<{}> }
    }
}