import { Client } from "discord.js";
import ModuleBase from "./libs/ModuleManager/types/Module";
export default class BotClient extends Client {
    private readonly forcedToken;
    private readonly name;
    private config;
    private exiting;
    private readonly moduleManager;
    constructor(options: botOptions);
    start(): Promise<void>;
    loadModule(id: string, module: ModuleBase): Promise<boolean>;
}
