"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleLoadFail = exports.getErrorEmbed = exports.UnknownSubCommandException = exports.UnknownCommandException = exports.ModalException = exports.ButtonException = exports.CommandException = exports.InteractionException = exports.NotAModuleException = exports.InvalidModuleIDException = exports.ModuleFetchException = void 0;
const discord_js_1 = require("discord.js");
class ModuleFetchException extends Error {
    constructor(msg = "An unknown exception occurred") {
        super(`Failed to fetch module: ${msg}`);
    }
}
exports.ModuleFetchException = ModuleFetchException;
class InvalidModuleIDException extends ModuleFetchException {
    constructor(id) {
        super(`Invalid module id "${id}", ID must only contain letters, numbers, and underscores`);
    }
}
exports.InvalidModuleIDException = InvalidModuleIDException;
class NotAModuleException extends ModuleFetchException {
    constructor(id) {
        super(`Unable to create new module for ${id}. Ensure the class implements ModuleBase and is "export default"`);
    }
}
exports.NotAModuleException = NotAModuleException;
class InteractionException extends Error {
    logStack;
    constructor(msg = "Failed to process interaction: An unknown exception occurred", logStack = false) {
        super(msg);
        this.logStack = logStack;
    }
}
exports.InteractionException = InteractionException;
class CommandException extends InteractionException {
    constructor(msg = "An unknown exception occurred", logStack = false) {
        super(`Failed to execute command: ${msg}`, logStack);
    }
}
exports.CommandException = CommandException;
class ButtonException extends InteractionException {
    constructor(msg = "An unknown exception occurred", logStack = false) {
        super(`Failed to process button: ${msg}`, logStack);
    }
}
exports.ButtonException = ButtonException;
class ModalException extends InteractionException {
    constructor(msg = "An unknown exception occurred", logStack = false) {
        super(`Failed to process modal: ${msg}`, logStack);
    }
}
exports.ModalException = ModalException;
class UnknownCommandException extends CommandException {
    constructor() {
        super("Command does not exist on bot", false);
    }
}
exports.UnknownCommandException = UnknownCommandException;
class UnknownSubCommandException extends CommandException {
    constructor(interaction) {
        const subGroup = interaction.options.getSubcommandGroup();
        if (subGroup) {
            super(`Sub command ${subGroup} ${interaction.options.getSubcommand()} does not exist.`);
        }
        else {
            super(`Sub command ${interaction.options.getSubcommand()} does not exist.`);
        }
    }
}
exports.UnknownSubCommandException = UnknownSubCommandException;
function getErrorEmbed(name, message, interaction) {
    if (message.indexOf("`") < 0) {
        message = "`" + message + "`";
    }
    const error = new discord_js_1.EmbedBuilder()
        .setTitle("Interaction exception")
        .setDescription(message)
        .setTimestamp(interaction.createdTimestamp)
        .setFooter({
        text: `Interaction: ${name}`,
        iconURL: "https://cdn.discordapp.com/emojis/483993897115189287.png?v=1",
    })
        .setColor(global.colours.error);
    if (interaction.isChatInputCommand()) {
        error.setTitle("Command Exception");
        error.setFooter({
            text: `Command: ${name}`,
            iconURL: "https://cdn.discordapp.com/emojis/483993897115189287.png?v=1",
        });
    }
    else if (interaction.isButton()) {
        error.setTitle("Button Exception");
        error.setFooter({
            text: `Button: ${name}`,
            iconURL: "https://cdn.discordapp.com/emojis/483993897115189287.png?v=1",
        });
    }
    else if (interaction.isModalSubmit()) {
        error.setTitle("Modal Exception");
        error.setFooter({
            text: `Modal: ${name}`,
            iconURL: "https://cdn.discordapp.com/emojis/483993897115189287.png?v=1",
        });
    }
    return error.toJSON();
}
exports.getErrorEmbed = getErrorEmbed;
class ModuleLoadFail extends Error {
    constructor(name, msg = "A unexpected error occurred") {
        super(`Failed to load module ${name}: ${msg}`);
    }
}
exports.ModuleLoadFail = ModuleLoadFail;
