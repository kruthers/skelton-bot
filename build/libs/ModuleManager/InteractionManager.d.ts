import { ButtonInteraction, Client, CommandInteraction, Interaction, ModalSubmitInteraction, SelectMenuInteraction } from "discord.js";
import { BotCommand } from "./types/Module";
export default class InteractionManager {
    private client;
    private commands;
    private buttons;
    private modals;
    private selectMenus;
    constructor(client: Client);
    onInteraction(interaction: Interaction): Promise<void>;
    /**
     * Process a command interaction
     * @param interaction the interaction to process as command
     */
    processCommand(interaction: CommandInteraction): Promise<void>;
    /**
     * Will refresh the clients cache of commands by fetching them all
     * @param removeOld If old command should be removed from the bot
     */
    refreshCommandCache(removeOld: boolean): Promise<void>;
    /**
     * Add a command to the command manager
     * @param command The command to add
     * @param moduleID The id of the module the command originated from
     */
    addCommand(command: BotCommand, moduleID: string): void;
    /**
     * Remove a command from the command manager
     * @param commandID The id of the command to get
    */
    removeCommand(name: string): void;
    /**
     * Removes all commands from the bot
     * @deprecated Debugging only
    */
    clearBotCommands(): Promise<void>;
    /**
     * Removes all interactions related to a set module
     * @param moduleID module to process
     */
    removeModuleData(moduleID: string): Promise<void>;
    /**
     * Adds a button interaction with a function
     * @param id the id of the button
     * @param callback function to call if the interaction is triggered
     */
    addButtonInteraction(id: string, callback: (interaction: ButtonInteraction) => void, moduleID: string): Promise<void>;
    /**
     * Process a button interaction
     * @param interaction the interaction to process
     */
    processButton(interaction: ButtonInteraction): Promise<void>;
    /**
     * Adds a modal interaction with a function
     * @param id the id of the modal
     * @param callback function to call if the modal is triggered
     */
    addModalInteraction(id: string, callback: (interaction: ModalSubmitInteraction) => void, moduleID: string): Promise<void>;
    /**
     * Process a modal submit interaction
     * @param interaction the interaction to process
     */
    processModal(interaction: ModalSubmitInteraction): Promise<void>;
    /**
     * Adds a selection menu interaction with a function
     * @param id the id of the modal
     * @param callback function to call if the modal is triggered
     */
    addSelectMenuInteraction(id: string, callback: (interaction: SelectMenuInteraction) => void, moduleID: string): Promise<void>;
    /**
     * Process a select menu submit interaction
     * @param interaction the interaction to process
     */
    processSelectMenu(interaction: SelectMenuInteraction): Promise<void>;
}
