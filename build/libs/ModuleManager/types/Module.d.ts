import { ApplicationCommandData, AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, ModalSubmitInteraction, RESTPostAPIApplicationCommandsJSONBody, SelectMenuInteraction } from "discord.js";
import BotClient from "../../../BotClient";
export default abstract class ModuleBase {
    /**
     * The name of the module
     */
    abstract readonly name: string;
    /**
     * Any Required module the module has
     */
    abstract readonly depend_on?: string[];
    /**
     * The module's development version
     */
    abstract readonly version: string;
    /**
     * Short description of what the module is / does
     */
    abstract readonly description: string;
    /**
     * The author(s) of the module
     */
    abstract readonly author: string | string[];
    /**
     * Module's Commands
     */
    readonly commands?: BotCommand[];
    /**
     * Buttons
     * Any buttons used in your module
     * <id, callback>
     */
    readonly buttons?: Map<string, (interaction: ButtonInteraction) => void>;
    /**
    * Modals (forms)
    * Any forms used by your module
    * <id, callback>
    */
    readonly modals?: Map<string, (interaction: ModalSubmitInteraction) => void>;
    /**
    * Menus
    * Any forms used by your module
    * <id, callback>
    */
    readonly menus?: Map<string, (interaction: SelectMenuInteraction) => void>;
    /**
     * Loads the module's resources into the main system
     * @param bot The discord bot client
     */
    abstract load?: (client: BotClient) => Promise<void> | void;
    /**
     * UnLoads the module's resources into the main system
     * @param bot The discord bot client
     */
    unload?: (client: BotClient) => Promise<void> | void;
}
export declare type BotCommand = {
    cmd_data: ApplicationCommandData | RESTPostAPIApplicationCommandsJSONBody;
    callback: (interaction: ChatInputCommandInteraction) => void;
    name: string;
    autoComplete?: (interaction: AutocompleteInteraction) => void;
};
