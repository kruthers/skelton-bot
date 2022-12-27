"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const path_1 = require("path");
const Config_1 = require("./libs/Config");
const logger_1 = require("./libs/logger");
const main_1 = require("./libs/ModuleManager/main");
const Module_1 = require("./libs/ModuleManager/types/Module");
//Libs
exports.Logger = logger_1.Logger;
exports.Config = Config_1.default;
//Module manager
exports.ModuleBase = Module_1.default;
//exceptions
// exports.CommandException = CommandException
// exports.CommandException = InteractionException
__exportStar(require("./libs/ModuleManager/Errors"), exports);
class Client extends discord_js_1.Client {
    forcedToken;
    name;
    config = new Config_1.default("core", {
        token: "REPLACE_ME",
        log: {
            level: "info",
            messages: false,
            commands: false,
        },
    }, false);
    exiting = false;
    moduleManager;
    constructor(options) {
        super({
            intents: options.intents,
        });
        (0, logger_1.startLogger)((0, path_1.join)(options.base_folder, "./logs/"));
        this.moduleManager = new main_1.default(this, (0, path_1.join)(options.base_folder, "./modules/"));
        Config_1.default.PATH = (0, path_1.join)(options.base_folder, "./config/");
        this.forcedToken = options.token;
        this.name = options.name;
        //add listeners
        this.on("disconnect", () => {
            logger_1.Logger.severe("Disconnected from Discord");
            process.exit();
        });
        this.on("messageCreate", (message) => {
            if (message.author.id !== this.user?.id) {
                logger_1.Logger.message(message);
            }
        });
        this.once("ready", async () => {
            logger_1.Logger.info("Connected to Discord");
            logger_1.Logger.info("Loading modules");
            // await moduleManager.commandManager.clearBotCommands(); //DEBUG
            await this.moduleManager.init();
            logger_1.Logger.info(`${this.name} is now online and running!`);
            logger_1.Logger.info("Bot is now running");
        });
        const exit_events = ["SIGINT", "SIGUSR1", "SIGUSR2", "SIGTERM", "exit"];
        exit_events.forEach((event) => {
            process.on(event, async () => {
                if (this.exiting)
                    return;
                this.exiting = true;
                logger_1.Logger.severe("Exit event detected");
                logger_1.Logger.info("Unloading modules");
                await this.moduleManager.unloadAll();
                logger_1.Logger.info("Modules unloaded");
                logger_1.Logger.warn("Terminating bot");
                this.destroy();
                logger_1.Logger.info(`${this.name} processes ended, good bye o/`);
                logger_1.Logger.severe("Bot now offline");
                process.exit();
            });
        });
    }
    async start() {
        logger_1.Logger.info(`Starting ${this.name}...`);
        //load the config DIR
        if (!(0, Config_1.loadFolder)()) {
            setTimeout(() => {
                process.exit(2);
            }, 100);
            return;
        }
        logger_1.Logger.info("Loading core config");
        //make sure the main config is loaded
        await this.config.load();
        //validate log level
        if (!["info", "debug", "silly"].includes(this.config.data.log.level)) {
            logger_1.Logger.warn("Invalid level set in /config/core.json must either info/debug/silly");
            this.config.data.log.level = "info";
        }
        global.log = this.config.data.log;
        logger_1.Logger.transports.console.level = global.log.level;
        logger_1.Logger.info("Core config loaded");
        // see if message logging is on
        // Does not do anything right now, need to update the log transports used TODO
        if (global.log.messages) {
            logger_1.Logger.warn("Message logging is enabled! This is not supported and should only be used for testing.".yellow);
        }
        //handle token
        if (this.forcedToken) {
            logger_1.Logger.severe("A forced token is in use, it is not recommended to use a forced token in your main functions");
            logger_1.Logger.info("Attempting to log in..");
            this.login(this.forcedToken);
        }
        else {
            // load the token and ensure it is set
            if (this.config.data.token == "" || this.config.data.token == "REPLACE_ME") {
                logger_1.Logger.warn("No token provided in \"/config/core.json please set before starting the bot");
                logger_1.Logger.severe("Invalid token provided, failed to start bot");
                setTimeout(() => {
                    process.exit(2);
                }, 100);
                return;
            }
            logger_1.Logger.info("Attempting to log in..");
            this.login(this.config.data.token);
        }
    }
    loadModule(id, module) {
        return this.moduleManager.load(id, module);
    }
}
exports.default = Client;
