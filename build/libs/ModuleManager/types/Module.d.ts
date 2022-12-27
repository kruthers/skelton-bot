import { ApplicationCommandData, ButtonInteraction, ChatInputCommandInteraction, ModalSubmitInteraction, RESTPostAPIApplicationCommandsJSONBody, SelectMenuInteraction } from "discord.js";
import Client from "../../../main";
export default abstract class ModuleBase {
    /**
     * The name of the module
     */
    readonly name: string;
    /**
     * Any Required module the module has
     */
    readonly depend_on?: string[];
    /**
     * The module's development version
     */
    readonly version: string;
    /**
     * Short description of what the module is / does
     */
    readonly description: string;
    /**
     * The author(s) of the module
     */
    readonly author: string | string[];
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
    load?: (client: Client) => Promise<void> | void;
    /**
     * UnLoads the module's resources into the main system
     * @param bot The discord bot client
     */
    unload?: (client: Client) => Promise<void> | void;
}
export declare type BotCommand = {
    cmd_data: ApplicationCommandData | RESTPostAPIApplicationCommandsJSONBody;
    function: (interaction: ChatInputCommandInteraction) => void;
    name: string;
};
