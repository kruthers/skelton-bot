"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./libs/logger");
const v10_1 = require("discord-api-types/v10");
const main_1 = require("./main");
/**
 * Initialize variables
 */
const bot = new main_1.default({
    name: "Test Bot",
    intents: [
        v10_1.GatewayIntentBits.Guilds,
        v10_1.GatewayIntentBits.DirectMessages,
        v10_1.GatewayIntentBits.GuildMembers,
        v10_1.GatewayIntentBits.GuildMessages,
        v10_1.GatewayIntentBits.GuildMessageReactions,
        v10_1.GatewayIntentBits.GuildEmojisAndStickers,
        v10_1.GatewayIntentBits.GuildScheduledEvents,
        v10_1.GatewayIntentBits.MessageContent,
    ],
    base_folder: __dirname,
});
bot.on("reload", () => {
    bot.loadModule("example", new ExampleModule());
});
bot.start();
class ExampleModule {
    name = "Example Module";
    version = "1.0.0";
    description = "A example/ test module used to show case the bots features";
    author = "kruthers";
    commands = [
        {
            name: "Ping Command",
            cmd_data: {
                name: "ping",
                description: "Will say pong",
            },
            function: (interaction) => {
                interaction.reply("Pong");
            },
        },
    ];
    load(bot) {
        logger_1.Logger.info("Hello wold, example module has been loaded");
        bot.user?.setPresence({ activities: [{ name: "Test" }], status: "online" });
    }
    unload() {
        logger_1.Logger.info("Example module has been unloaded");
    }
}
