"use strict";
/* eslint-disable no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
Object.defineProperty(exports, "__esModule", { value: true });
class ModuleBase {
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
     * UnLoads the module's resources into the main system
     * @param bot The discord bot client
     */
    // unload(bot: Client): void {}
    unload;
}
exports.default = ModuleBase;
