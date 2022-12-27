import { Client as DClient } from "discord.js";
import ModuleBase from "./libs/ModuleManager/types/Module";
export * from "./libs/ModuleManager/Errors";
export default class Client extends DClient {
    private readonly forcedToken;
    private readonly name;
    private config;
    private exiting;
    private readonly moduleManager;
    constructor(options: botOptions);
    start(): Promise<void>;
    loadModule(id: string, module: ModuleBase): Promise<boolean>;
}
