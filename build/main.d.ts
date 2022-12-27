export { default as Client } from "./BotClient";
export declare type BotOptions = botOptions;
export { Logger } from "./libs/logger";
export { default as Config } from "./libs/Config";
export { default as ModuleBase, BotCommand } from "./libs/ModuleManager/types/Module";
export * from "./libs/ModuleManager/Errors";
declare const _default: {
    error: number;
    success: number;
    warn: number;
    standby: number;
    neutral: number;
};
export default _default;
