//client
export { default as Client } from "./BotClient"
export type BotOptions = botOptions

//Libs
export { Logger } from "./libs/logger"
export { default as Config } from "./libs/Config"

//Module manager
export { default as ModuleBase, BotCommand } from "./libs/ModuleManager/types/Module"

//exceptions
export * from "./libs/ModuleManager/Errors"