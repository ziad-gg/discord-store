
declare module "djs.db" {
    class Client {
        constructor(token: string, guildId?: string);
        public init(): Promise<{ client: { name: string, id: string }, guild: { name: string, id: string }, clientId: string, guildId: string }>
        public document: Document
    }

    interface Document {
        read(id: string, chunk?: number, output?: string): Promise<{ total: number, name: string }>, 
        write(path: string, options?: { size: number, cb: () => {}, name: string }): Promise<string>
    }
}