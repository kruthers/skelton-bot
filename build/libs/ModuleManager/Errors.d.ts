import { APIEmbed, ChatInputCommandInteraction, Interaction } from "discord.js";
export declare class ModuleFetchException extends Error {
    constructor(msg?: string);
}
export declare class InvalidModuleIDException extends ModuleFetchException {
    constructor(id: string);
}
export declare class NotAModuleException extends ModuleFetchException {
    constructor(id: string);
}
export declare class InteractionException extends Error {
    logStack: boolean;
    constructor(msg?: string, logStack?: boolean);
}
export declare class CommandException extends InteractionException {
    constructor(msg?: string, logStack?: boolean);
}
export declare class ButtonException extends InteractionException {
    constructor(msg?: string, logStack?: boolean);
}
export declare class ModalException extends InteractionException {
    constructor(msg?: string, logStack?: boolean);
}
export declare class UnknownCommandException extends CommandException {
    constructor();
}
export declare class UnknownSubCommandException extends CommandException {
    constructor(interaction: ChatInputCommandInteraction);
}
export declare function getErrorEmbed(name: string, message: string, interaction: Interaction): APIEmbed;
export declare class ModuleLoadFail extends Error {
    constructor(name: string, msg?: unknown);
}
