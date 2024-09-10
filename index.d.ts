
declare module "djs.db" {
    class Client {
        constructor(token: string, guildId?: string);
        public init(): Promise<void>
        public document: Document
    }

    interface Document {
        read(id: string, output: string, chunk?: number): Promise<number>, 
        write(path: string, size?: number): Promise<string>
    }
}