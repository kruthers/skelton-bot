"use strict";
/* eslint-disable no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
Object.defineProperty(exports, "__esModule", { value: true });
class ModuleBase {
    /**
     * The name of the module
     */
    name;
    /**
     * Any Required module the module has
     */
    depend_on;
    /**
     * The module's development version
     */
    version;
    /**
     * Short description of what the module is / does
     */
    description;
    /**
     * The author(s) of the module
     */
    author;
    /**
     * Module's Commands
     */
    commands;
    /**
     * Buttons
     * Any buttons used in your module
     * <id, callback>
     */
    buttons;
    /**
    * Modals (forms)
    * Any forms used by your module
    * <id, callback>
    */
    modals;
    /**
    * Menus
    * Any forms used by your module
    * <id, callback>
    */
    menus;
    /**
     * Loads the module's resources into the main system
     * @param bot The discord bot client
     */
    // load(bot: Client): void {}
    load;
    /**
     * UnLoads the module's resources into the main system
     * @param bot The discord bot client
     */
    // unload(bot: Client): void {}
    unload;
}
exports.default = ModuleBase;
