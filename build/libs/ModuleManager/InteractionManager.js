"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../logger");
const Errors_1 = require("./Errors");
class InteractionManager {
    client;
    //interactions
    commands = new Map();
    buttons = new Map();
    modals = new Map();
    selectMenus = new Map();
    constructor(client) {
        this.client = client;
    }
    async onInteraction(interaction) {
        let type = "Interaction";
        let name = "Unknown";
        try {
            if (interaction.isChatInputCommand()) {
                type = "Command";
                name = interaction.commandName;
                await this.processCommand(interaction);
            }
            else if (interaction.isButton()) {
                type = "Button";
                name = interaction.customId;
                await this.processButton(interaction);
            }
            else if (interaction.isModalSubmit()) {
                type = "Modal";
                name = interaction.customId;
                await this.processModal(interaction);
            }
            else if (interaction.isSelectMenu()) {
                type = "Select Menu";
                name = interaction.customId;
                await this.processSelectMenu(interaction);
            }
            else if (interaction.isAutocomplete()) {
                type = "Auto Complete";
                name = interaction.commandName;
                await this.processAutoComplete(interaction);
            }
            else {
                logger_1.Logger.warn("Interaction type not yet processed by bot");
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            logger_1.Logger.warn("Caught interaction processing error");
            if (!(interaction.isChatInputCommand() || interaction.isButton() || interaction.isModalSubmit() || interaction.isSelectMenu()))
                return;
            logger_1.Logger.warn(`${type} ${name} failed to execute for ${interaction.user.username}`);
            let embed = (0, Errors_1.getErrorEmbed)(name, "An unexpected error occurred:\n```" + error.name + ": " + error.stack + "```", interaction);
            if (error instanceof Errors_1.InteractionException) {
                let msg = error.message;
                if (error.logStack) {
                    msg = error.message + ":\n ```" + error.stack + "```";
                }
                embed = (0, Errors_1.getErrorEmbed)(name, msg, interaction);
            }
            else {
                embed = (0, Errors_1.getErrorEmbed)(name, "An unexpected error occurred:\n```" + error.name + ": " + error.stack + "```", interaction);
            }
            //either reply or edit the reply to the message
            if (interaction.replied || interaction.deferred) {
                interaction.editReply({ embeds: [embed] });
            }
            else {
                interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
    /**
     * Process a command interaction
     * @param interaction the interaction to process as command
     */
    //processes a command interaction
    async processCommand(interaction) {
        const commandName = interaction.commandName;
        const command = this.commands.get(commandName);
        if (global.log.commands)
            logger_1.Logger.info(`${interaction.user.username} ran command ${commandName}`);
        //check the command exists
        if (!command) {
            logger_1.Logger.warn(`Command ${commandName} not found`);
            this.refreshCommandCache(true);
            throw new Errors_1.UnknownCommandException();
        }
        //execute the command
        await command.data.callback(interaction);
    }
    /**
     * Process a command interaction
     * @param interaction the interaction to process as command
     */
    //processes a command interaction
    async processAutoComplete(interaction) {
        const commandName = interaction.commandName;
        const command = this.commands.get(commandName);
        //check the command exists
        if (!command) {
            logger_1.Logger.warn(`Command ${commandName} not found`);
            this.refreshCommandCache(true);
        }
        else if (command.data.autoComplete) {
            //execute the command
            command.data.autoComplete(interaction);
        }
    }
    /**
     * Will refresh the clients cache of commands by fetching them all
     * @param removeOld If old command should be removed from the bot
     */
    //will fetch all commands from discord to update the local cache
    async refreshCommandCache(removeOld) {
        const commands = await this.client.application?.commands.fetch();
        if (removeOld) {
            commands?.forEach(command => {
                if (!this.commands.has(command.name)) {
                    logger_1.Logger.warn(`Found old command ${command.name}, removing from bot`);
                    this.client.application?.commands.delete(command).then(() => {
                        logger_1.Logger.debug(`Command ${command.name} removed from bot`);
                    }).catch((error) => {
                        logger_1.Logger.warn(`Failed to remove ${command.name} from application: ${error}`);
                    });
                }
            });
        }
    }
    /**
     * Add a command to the command manager
     * @param command The command to add
     * @param moduleID The id of the module the command originated from
     */
    // converts the bot command and module id into a command data object and adds it to the commands map (name comes from command.cmd_data.name)
    addCommand(command, moduleID) {
        logger_1.Logger.debug(`Adding command ${command.name} to command manager`);
        const cmdData = {
            data: command,
            id: command.cmd_data.name,
            module: moduleID,
        };
        const app = this.client.application;
        let isOldCommand = false;
        app?.commands.cache.forEach((oldCmd) => {
            if (oldCmd.name == command.cmd_data.name) {
                logger_1.Logger.debug(`Command ${command.name} already exits on the bot as ID ${oldCmd.id}`);
                //mark it as being an old command
                isOldCommand = true;
                //attempt to edit the old version, with the new version
                app.commands.edit(oldCmd, command.cmd_data).then(() => {
                    logger_1.Logger.info(`Successfully updated command ${command.name}. (CMD ID ${oldCmd.id})`);
                    //save the command data into command
                    this.commands.set(cmdData.id, cmdData);
                }).catch((error) => {
                    logger_1.Logger.warn(`Failed to update old bot command ${command.name}, id: ${oldCmd.id}. Error:\n ${error}`);
                });
            }
        });
        //if there was no old version found, add the command as a new command
        if (!isOldCommand) {
            app?.commands.create(command.cmd_data).then((cmd) => {
                this.commands.set(cmdData.id, cmdData);
                logger_1.Logger.info(`Successfully added command ${command.name}. (CMD ID ${cmd.id})`);
            });
        }
    }
    /**
     * Remove a command from the command manager
     * @param commandID The id of the command to get
    */
    //remove a command from the array (if it has it) and remove it from the bot
    removeCommand(name) {
        if (this.commands.has(name)) {
            const app = this.client.application;
            app?.commands.cache.forEach((cmd) => {
                if (cmd.name == name) {
                    app.commands.delete(cmd).then(() => {
                        logger_1.Logger.info(`Successfully removed command ${name}. (CMD ID ${cmd.id})`);
                        this.commands.delete(name);
                    }).catch((error) => {
                        logger_1.Logger.warn(`Failed to remove command ${name} from application: ${error}`);
                    });
                }
            });
        }
    }
    /**
     * Removes all commands from the bot
     * @deprecated Debugging only
    */
    //clears all commands from the bot
    async clearBotCommands() {
        const app = this.client.application;
        logger_1.Logger.warn("Removing all commands from bot");
        const commands = await app?.commands.fetch();
        if (!commands) {
            logger_1.Logger.debug("Got no commands on bot");
            return;
        }
        for (const cmd of commands) {
            logger_1.Logger.debug(`Removing command ${cmd[1].name}, (ID: ${cmd[0]})`);
            await app?.commands.delete(cmd[0]);
            logger_1.Logger.info(`Removed command ${cmd[1].name}, (ID: ${cmd[0]})`);
        }
        logger_1.Logger.warn("All commands removed");
    }
    /**
     * Removes all interactions related to a set module
     * @param moduleID module to process
     */
    //removes all commands, buttons, modals, extra related to a module id
    async removeModuleData(moduleID) {
        logger_1.Logger.debug(`Removing commands, modals and buttons from ${moduleID}`);
        this.buttons.forEach((data, id) => {
            if (data.module == moduleID) {
                this.removeCommand(id);
            }
        });
        this.buttons.forEach((data, id) => {
            if (data.module == moduleID) {
                this.buttons.delete(id);
            }
        });
        this.modals.forEach((data, id) => {
            if (data.module == moduleID) {
                this.modals.delete(id);
            }
        });
    }
    /**
     * Adds a button interaction with a function
     * @param id the id of the button
     * @param callback function to call if the interaction is triggered
     */
    //adds a button id to monitor for interactions
    async addButtonInteraction(id, callback, moduleID) {
        const data = {
            id: id,
            callback: callback,
            module: moduleID,
        };
        this.buttons.set(id, data);
    }
    /**
     * Process a button interaction
     * @param interaction the interaction to process
     */
    //Process a button
    async processButton(interaction) {
        const name = interaction.customId;
        logger_1.Logger.debug(`${interaction.user.username} used button ${name} in ${interaction.guild?.name ?? "@" + interaction.user.username}`);
        const button = this.buttons.get(name);
        if (button) {
            button.callback(interaction);
        }
    }
    /**
     * Adds a modal interaction with a function
     * @param id the id of the modal
     * @param callback function to call if the modal is triggered
     */
    //adds a modal id to monitor for interactions
    async addModalInteraction(id, callback, moduleID) {
        const data = {
            id: id,
            callback: callback,
            module: moduleID,
        };
        this.modals.set(id, data);
    }
    /**
     * Process a modal submit interaction
     * @param interaction the interaction to process
     */
    //Process a submitted modal
    async processModal(interaction) {
        const name = interaction.customId;
        logger_1.Logger.debug(`${interaction.user.username} submitted modal ${name} in ${interaction.guild?.name ?? "@" + interaction.user.username}`);
        const modal = this.modals.get(name);
        if (modal) {
            modal.callback(interaction);
        }
    }
    /**
     * Adds a selection menu interaction with a function
     * @param id the id of the modal
     * @param callback function to call if the modal is triggered
     */
    //adds a select menu id for interactions
    async addSelectMenuInteraction(id, callback, moduleID) {
        const data = {
            id: id,
            callback: callback,
            module: moduleID,
        };
        this.selectMenus.set(id, data);
    }
    /**
     * Process a select menu submit interaction
     * @param interaction the interaction to process
     */
    //Process a select menu
    async processSelectMenu(interaction) {
        const name = interaction.customId;
        logger_1.Logger.debug(`${interaction.user.username} submit select menu ${name} in ${interaction.guild?.name ?? "@" + interaction.user.username}`);
        const selectMenu = this.selectMenus.get(name);
        if (selectMenu) {
            selectMenu.callback(interaction);
        }
    }
}
exports.default = InteractionManager;
