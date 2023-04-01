"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class TestCommand {
    bot;
    constructor(bot) {
        this.bot = bot;
    }
    cmd_data = {
        name: "set_status",
        description: "Set a test status",
        options: [
            {
                name: "status",
                description: "The new status",
                type: discord_js_1.ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    };
    async callback(interaction) {
        const status = interaction.options.getString("status", true);
        this.bot.user?.setActivity({
            name: status,
        });
        await interaction.reply("Updated bot's status");
    }
    name = "Status test command";
}
exports.default = TestCommand;
