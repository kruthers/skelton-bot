"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
const Config_1 = require("../Config");
const logger_1 = require("../logger");
const StringUtils_1 = require("../StringUtils");
const InteractionManager_1 = require("./InteractionManager");
const Errors_1 = require("./Errors");
const promises_1 = require("fs/promises");
class ModuleManager {
    //All enabled modules
    enabledModules = new Map;
    //List of all module ids
    modules = new Set();
    //command manager
    interactionManager;
    PATH;
    client;
    config = new Config_1.default("modules", {
        response_deletion_time: 15000,
        colours: {
            error: 15747399,
            success: 6549575,
            warn: 16763481,
            standby: 10395294,
            neutral: 3259125,
        },
        disabled: [],
    });
    constructor(client, path) {
        this.client = client;
        this.interactionManager = new InteractionManager_1.default(client);
        this.PATH = path;
    }
    /**
     * Will initialize all the bots modules, must be called on load
     */
    async init() {
        if (this.modules.size !== 0) {
            logger_1.Logger.warn("Warning tried to re-initialize an already initialized module manager, aborting initialization");
            return false;
        }
        if (!(0, fs_1.existsSync)(this.PATH)) {
            logger_1.Logger.warn("No module folder found, creating new one");
            await (0, promises_1.mkdir)(this.PATH);
        }
        await this.reload().catch(error => {
            logger_1.Logger.severe(`Failed to initialize module manager: ${error}`);
            return false;
        });
        await this.config.load();
        global.colours = this.config.data.colours;
        global.colors = global.colours;
        return true;
    }
    /**
     * Enable a module
     * @param id The id of the module to enable
     */
    async enable(id) {
        if (!this.modules.has(id)) {
            throw new Errors_1.ModuleLoadFail(id, "Unable to enable: Module is not loaded");
        }
        if (this.enabledModules.has(id)) {
            throw new Errors_1.ModuleLoadFail(id, "Unable to enable: Module is already enabled");
        }
        const module = await this.fetchModule(id);
        if (this.config.data.disabled.includes(id)) {
            this.config.data.disabled = this.config.data.disabled.filter(disabled => disabled !== id);
            await this.config.save();
        }
        //load modules
        await this.load(id, module);
    }
    /**
     * Disable a module
     * @param id The id of the module to disable
     */
    async disable(id, calledBy = []) {
        if (!this.modules.has(id)) {
            throw new Error(`Unable to disable ${id}, module is not loaded`);
        }
        if (!this.enabledModules.has(id)) {
            throw new Error(`Unable to disable ${id}, module is not enabled`);
        }
        if (id == "default") {
            throw new Error(`Unable to disable ${id}, module is required for the bot to function`);
        }
        //disable children modules
        for (const info of this.enabledModules) {
            if (info[1].depend_on?.includes(id)) {
                if (calledBy.includes(info[0])) {
                    logger_1.Logger.warn(`Circular dependency detected, modules ${info[0]} and ${id}`);
                    break;
                }
                else {
                    await this.disable(info[0], [...calledBy, id]);
                    break;
                }
            }
        }
        //Adds to disabled list
        this.config.data.disabled.push(id);
        //saves data
        await this.config.save();
        //unload modules
        await this.unload(id, true);
    }
    /**
     * Unload all modules
     */
    async unloadAll() {
        for (const module of this.enabledModules) {
            try {
                await this.unload(module[0]);
            }
            catch (err) {
                logger_1.Logger.severe(`Failed to unload ${module[0]}. Will not attempt to reload it!`);
                logger_1.Logger.warn(`${err}`);
                if (!this.config.data.disabled.includes(module[0])) {
                    this.config.data.disabled.push(module[0]);
                    //saves data
                    await this.config.save();
                }
            }
        }
    }
    /**
     * Will reload all the loaded modules
     * @param clearOldCommands if when fetching the cache if old commands should be removed
     */
    // works by first getting all the ids from the modules folder, then fetching them from the folders.
    // Then unload any loaded modules and then finlay load the modules in.
    async reload(clearOldCommands = false) {
        logger_1.Logger.warn("Reloading all modules");
        //check modules folder exists
        if (!(0, fs_1.existsSync)(this.PATH)) {
            logger_1.Logger.debug(`Failed to find directory ${this.PATH}`);
            throw new Error("Unable to find modules folder");
        }
        logger_1.Logger.info("Unloading any loaded modules and clearing cache");
        //unload all modules
        await this.unloadAll();
        //clear modules from cache first
        logger_1.Logger.debug("Clearing required cache");
        for (const required in require.cache) {
            if (required.startsWith(this.PATH)) {
                logger_1.Logger.silly(`Removing requirement: '${required}'`);
                delete require.cache[required]; // Remove the loaded module from node's cache
            }
        }
        logger_1.Logger.debug("Cleared all modules from cache");
        logger_1.Logger.debug("Getting all modules in modules folder");
        //Get all the modules
        const modulesIds = (0, fs_1.readdirSync)(this.PATH);
        if (modulesIds.length === 0) {
            logger_1.Logger.warn("No modules found in modules folder. It is highly recommended to load them via the folder".yellow);
        }
        logger_1.Logger.info("Clearing Listener");
        const reloads = this.client.listeners("reload");
        this.client.removeAllListeners();
        reloads.forEach((handler) => {
            this.client.on("reload", () => handler());
        });
        logger_1.Logger.info("Unloaded all modules, fetching all modules.");
        //get all modules
        let modulesInfo = [];
        for (const id of modulesIds) {
            //validate id
            if (this.validateID(id)) {
                logger_1.Logger.debug(`Fetching module '${id}'`);
                //gets the modules from the folder
                try {
                    const module = await this.fetchModule(id);
                    //get all parents for the modules
                    const parents = new Set();
                    module.depend_on?.forEach(parent => { parents.add(parent); });
                    //save the information for the module
                    const data = {
                        id: id,
                        module: module,
                        parents: parents,
                    };
                    modulesInfo.push(data);
                    logger_1.Logger.debug(`Registered module with id: ${id}`);
                }
                catch (error) {
                    logger_1.Logger.warn(`Unable to fetch module ${id}: ${error}`);
                }
            }
            else {
                logger_1.Logger.warn(`Unable to fetch module "${id}", invalid id. ID must only contain letters, numbers, and underscores`);
            }
        }
        //update data from config/ refresh config
        this.config.load();
        //update colours
        global.colours = this.config.data.colours;
        global.colors = global.colours;
        //clear loaded modules and modules list
        this.modules = new Set(modulesInfo.map(data => data.id));
        this.enabledModules = new Map();
        //remove disabled modules
        for (const module of modulesInfo) {
            if (this.config.data.disabled.includes(module.id)) {
                removeModule(module.id);
            }
        }
        //load new modules in
        logger_1.Logger.info("All modules fetched, loading modules");
        //load the default module
        logger_1.Logger.debug("Loading default module first");
        await this.load("default", new DefaultModule(this));
        logger_1.Logger.debug("Loaded default, sorting appendices");
        //functions to check dependencies are valid and are not circular
        function removeModule(id) {
            modulesInfo = modulesInfo.filter(module => module.id !== id);
        }
        function checkDecencies(module, parents = new Set()) {
            logger_1.Logger.silly(`Checking dependencies for module ${module.id}`);
            if (parents.has(module.id)) {
                removeModule(module.id);
                logger_1.Logger.warn(`Circular dependency detected, removing module '${module.id}'`);
                return false;
            }
            for (const parent of module.parents) {
                const parentModule = modulesInfo.find(m => m.id === parent);
                if (parentModule) {
                    if (!checkDecencies(parentModule, parents)) {
                        removeModule(module.id);
                        logger_1.Logger.warn(`Circular dependency detected, removing module '${module.id}'`);
                        return false;
                    }
                }
                else {
                    removeModule(module.id);
                    logger_1.Logger.warn(`Unable to find parent module ${parent} for module ${module.id}`);
                    return false;
                }
                parents.add(parent);
            }
            return true;
        }
        //cycle though all modules checking they are all valid, will re-parse until they are all valid or there are no more modules to check
        let checked = 0;
        while (checked < modulesInfo.length) {
            const module = modulesInfo[checked];
            if (module.parents.size === 0) {
                checked++;
            }
            else if (checkDecencies(module)) {
                checked++;
            }
            else {
                logger_1.Logger.debug(`Unable to load module ${module.id}, restarting checks`);
                checked == 0;
            }
        }
        //load all the modules
        let failed = 0;
        while (modulesInfo.length > 0) {
            const module = modulesInfo[0];
            let goodToLoad = true;
            for (const parent of module.parents) {
                if (!this.enabledModules.has(parent) && goodToLoad) {
                    goodToLoad = false;
                }
            }
            if (goodToLoad) {
                try {
                    logger_1.Logger.debug(`Loading module ${module.id}`);
                    //load the module
                    await this.load(module.id, module.module);
                    logger_1.Logger.info(`Successfully loaded module ${module.id}`);
                }
                catch (err) {
                    if (err instanceof Errors_1.ModuleLoadFail) {
                        logger_1.Logger.severe(`${err}`);
                    }
                    else {
                        logger_1.Logger.severe(`${new Errors_1.ModuleLoadFail(`${err}`)}`);
                    }
                }
                modulesInfo.shift();
                failed = 0;
            }
            else {
                modulesInfo.push(module);
                modulesInfo.shift();
                failed++;
                if (failed >= modulesInfo.length) {
                    logger_1.Logger.severe("Reload cycle failed, some modules will not be working.");
                    logger_1.Logger.info(`Known modules: ${(0, StringUtils_1.StringSetToSting)(this.modules)}, Loaded modules: ${(0, StringUtils_1.StringIteratorToSting)(this.enabledModules.keys())}`);
                    //reload command manager cache
                    logger_1.Logger.debug("Reloading command manager cache");
                    await this.interactionManager.refreshCommandCache(clearOldCommands);
                    //terminate process
                    throw new Error("Unable to load all modules, dependencies are not met");
                }
            }
        }
        //trigger reload event
        logger_1.Logger.debug("Sending reload event");
        this.client.emit("reload");
        //reload command manager cache
        logger_1.Logger.debug("Reloading command manager cache");
        await this.interactionManager.refreshCommandCache(clearOldCommands);
        logger_1.Logger.info("Register listener");
        this.client.on("interactionCreate", (interaction) => { this.interactionManager.onInteraction(interaction); });
        logger_1.Logger.info("Reload completed".green);
    }
    /**
     * Gets all the enabled modules
     * @returns Enabled modules
     */
    getEnabledModules() {
        return this.enabledModules;
    }
    /**
     * Gets all the enabled modules
     * @returns Enabled modules
     */
    async getDisabledModules() {
        const disabledModules = new Map();
        const it = this.modules.keys();
        let result = it.next();
        while (!result.done) {
            const module = result.value;
            if (!this.enabledModules.has(module)) {
                try {
                    const data = await this.fetchModule(module);
                    disabledModules.set(module, data);
                }
                catch (err) {
                    logger_1.Logger.warn(`Unable to get disabled module ${module}`);
                }
            }
            result = it.next();
        }
        return disabledModules;
    }
    /**
     * Enables/ Loads a module
     * @param id The id of the module
     * @param modules The modules to load under the ID
     * @returns If the modules were loaded
    */
    //Loads a provided module
    async load(id, module) {
        //check the id provided is valid for a folder
        if (!this.validateID(id)) {
            throw new Errors_1.InvalidModuleIDException(id);
        }
        //check if the module is disabled
        if (this.config.data.disabled.includes(id)) {
            throw new Error(`Unable to load "${id}", module disabled`);
        }
        //check if the module is already loaded
        if (this.enabledModules.has(id)) {
            throw new Error(`Unable to load ${id}, module is already loaded`);
        }
        //get all parents
        const parents = new Set();
        if (module.depend_on) {
            module.depend_on.forEach(parent => {
                parents.add(parent);
            });
        }
        //check if all the parents are loaded
        for (const parent of parents) {
            if (!this.enabledModules.has(parent)) {
                throw new Error(`Unable to load '${id}', parent module '${parent}' is not loaded`);
            }
        }
        //load the modules
        logger_1.Logger.debug(`Loading module for ${id}`);
        try {
            logger_1.Logger.debug(`Loading module ${module.name} from ${id}`);
            if (module.load) {
                await module.load(this.client);
            }
        }
        catch (error) {
            await this.interactionManager.removeModuleData(id);
            throw new Errors_1.ModuleLoadFail(id, `Failed to execute module loaded ${error}`);
        }
        //register commands
        if (module.commands) {
            logger_1.Logger.debug(`Registering commands for module ${module.name} from ${id}`);
            for (const command of module.commands) {
                this.interactionManager.addCommand(command, id);
            }
        }
        //register buttons
        if (module.buttons) {
            logger_1.Logger.debug(`Registering buttons for module ${module.name} from ${id}`);
            for (const button of module.buttons) {
                this.interactionManager.addButtonInteraction(button[0], button[1], id);
            }
        }
        //register modals
        if (module.modals) {
            logger_1.Logger.debug(`Registering modals for module ${module.name} from ${id}`);
            for (const modal of module.modals) {
                this.interactionManager.addModalInteraction(modal[0], modal[1], id);
            }
        }
        //register menus
        if (module.menus) {
            logger_1.Logger.debug(`Registering select menus for module ${module.name} from ${id}`);
            for (const menu of module.menus) {
                this.interactionManager.addSelectMenuInteraction(menu[0], menu[1], id);
            }
        }
        this.modules.add(id);
        this.enabledModules.set(id, module);
        logger_1.Logger.info(`Loaded module ${id}`);
        return true;
    }
    //check if the provided object is a module
    isModule(object) {
        return Object.prototype.hasOwnProperty.call(object, "name")
            && Object.prototype.hasOwnProperty.call(object, "version")
            && Object.prototype.hasOwnProperty.call(object, "description")
            && Object.prototype.hasOwnProperty.call(object, "author");
    }
    /**
     * Gets a module from its folder
     * @param id The id of the module
     * @returns An array of the modules found within the folder
    */
    //fetch function, will fetch a module(s) from its folder and return it, or null if no module is loaded
    async fetchModule(id) {
        //validate the file name as a valid module id
        if (!this.validateID(id)) {
            throw new Errors_1.InvalidModuleIDException(id);
        }
        //check if the folder exists
        if ((0, fs_1.existsSync)((0, path_1.join)(this.PATH, id))) {
            //check a module.js file exists
            if ((0, fs_1.existsSync)((0, path_1.join)(this.PATH, id, "module.js"))) {
                try {
                    //load the module file
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const Module = require((0, path_1.join)(this.PATH, id, "module.js")).default;
                    logger_1.Logger.debug(`Fetched module file for ${id}, loading module classes`);
                    //load classes of module
                    logger_1.Logger.debug(`Fetching module ${id}`);
                    let module;
                    try {
                        module = new Module();
                    }
                    catch (err) {
                        logger_1.Logger.silly(`Could not create module ${id}: ${err}`);
                        throw new Errors_1.NotAModuleException(id);
                    }
                    //check if the class is a module
                    if (this.isModule(module)) {
                        //check the module is valid
                        if (module.name === "") {
                            throw new Errors_1.NotAModuleException(id);
                        }
                    }
                    else {
                        throw new Errors_1.NotAModuleException(id);
                    }
                    return module;
                }
                catch (error) {
                    throw new Errors_1.ModuleFetchException(`${error}`);
                }
            }
            else {
                throw new Errors_1.ModuleFetchException(`Module ${id} does not have a module.js file`);
            }
        }
        else {
            throw new Errors_1.ModuleFetchException(`Module ${id} does not exist`);
        }
    }
    /**
     * Unloads a module
     * @param id The id of the module
     * @returns If the module was unloaded
     */
    //disable a module from the enabled modules list based on its id
    async unload(id, removeBotData = false) {
        if (this.enabledModules.has(id)) {
            logger_1.Logger.debug(`Unloading module ${id}`);
            //get the modules
            const module = this.enabledModules.get(id);
            //check it has modules
            if (module === undefined) {
                logger_1.Logger.warn(`Unable to unload ${id}, unable to fetch module`);
                this.enabledModules.delete(id); //remove it anyway
                return false;
            }
            //unload the modules
            try {
                if (module.unload) {
                    logger_1.Logger.debug(`Unloading module ${module.name} from ${id}`);
                    module.unload(this.client);
                }
            }
            catch (err) {
                logger_1.Logger.severe(`Failed run module unload ${id}: ${err}`);
            }
            //remove any interactions related to a module id
            if (removeBotData)
                this.interactionManager.removeModuleData(id);
            //remove the module from the enabled modules list
            this.enabledModules.delete(id);
            logger_1.Logger.info(`Unloaded module ${id}`);
            return true;
        }
        else {
            logger_1.Logger.warn(`Module ${id} is not loaded`);
            return false;
        }
    }
    /**
     * Used to validate module ids, must match regex '^\w{3,}$'
     * @param id The id to validate
     * @param
     * @returns If the id is valid
     */
    validateID(id) {
        const regex = /^[a-z0-9_-]{3,}$/gm;
        return regex.test(id);
    }
}
exports.default = ModuleManager;
/**
 * Default module
 */
class DefaultModule {
    moduleManager;
    constructor(moduleManager) {
        this.moduleManager = moduleManager;
    }
    name = "Default Module";
    version = "1.0.0";
    description = "Default module loaded by the bot, CAN NOT be disabled";
    author = "kruthers";
    commands = [
        {
            name: "reload",
            cmd_data: {
                name: "reload",
                description: "Reload the bot's modules",
            },
            function: (interaction) => {
                const reloaded = {
                    title: "Reloaded successfully!",
                    color: global.colours.success,
                };
                interaction.reply({ embeds: [
                        {
                            title: "Reloading...",
                            color: global.colours.standby,
                        },
                    ], fetchReply: true }).then((msg) => {
                    this.moduleManager.reload().then(() => {
                        if (msg instanceof discord_js_1.Message) {
                            msg.edit({ embeds: [reloaded] });
                        }
                        else {
                            interaction.channel?.send({ embeds: [reloaded] });
                        }
                    });
                });
            },
        },
        {
            name: "modules",
            cmd_data: {
                name: "modules",
                description: "Manage and list current modules",
                type: discord_js_1.ApplicationCommandType.ChatInput,
                options: [
                    {
                        name: "list",
                        type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                        description: "List all modules",
                    },
                    {
                        name: "enable",
                        type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                        description: "Enable a module",
                        options: [
                            {
                                name: "module",
                                type: discord_js_1.ApplicationCommandOptionType.String,
                                description: "Module to enable",
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "disable",
                        type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                        description: "Disable a module",
                        options: [
                            {
                                name: "module",
                                type: discord_js_1.ApplicationCommandOptionType.String,
                                description: "Module to disable",
                                required: true,
                            },
                        ],
                    },
                ],
            },
            function: (interaction) => {
                function getModuleFields(id, module) {
                    const fields = [];
                    if (Array.isArray(module.author)) {
                        fields.push({ name: `${module.name} (*${id}*) v${module.version}`, value: `${module.description}\n*By: ${module.author.join(", ")}*`, inline: false });
                    }
                    else {
                        fields.push({ name: `${module.name} (*${id}*) v${module.version}`, value: `${module.description}\n*By: ${module.author}*`, inline: false });
                    }
                    return fields;
                }
                const subCommand = interaction.options.getSubcommand();
                switch (subCommand) {
                    case "list": {
                        const enabled = new discord_js_1.EmbedBuilder({
                            title: "Enabled Modules",
                            description: "Here's the list of currently enabled modules:",
                            color: global.colors.success,
                        });
                        for (const [id, module] of this.moduleManager.getEnabledModules()) {
                            enabled.addFields(getModuleFields(id, module));
                        }
                        this.moduleManager.getDisabledModules().then(disabledModules => {
                            let disabled = new discord_js_1.EmbedBuilder({
                                title: "Disabled Modules",
                                description: "There is currently no disabled modules",
                                color: global.colors.warn,
                            });
                            if (disabledModules.size > 0) {
                                disabled = new discord_js_1.EmbedBuilder({
                                    title: "Disabled Modules",
                                    description: "Here's the list of currently disabled modules:",
                                    color: global.colors.error,
                                });
                                const it = disabledModules.keys();
                                let result = it.next();
                                while (!result.done) {
                                    const id = result.value;
                                    const module = disabledModules.get(id);
                                    if (module != null) {
                                        disabled.addFields(getModuleFields(id, module));
                                    }
                                    result = it.next();
                                }
                            }
                            interaction.reply({ embeds: [enabled, disabled] });
                        });
                        break;
                    }
                    case "enable": {
                        logger_1.Logger.debug(`User ${interaction.user.username} is enabling module ${interaction.options.getString("module")}`);
                        const module = interaction.options.getString("module");
                        if (module) {
                            interaction.reply({
                                embeds: [
                                    new discord_js_1.EmbedBuilder({
                                        title: `Attempting to enable module *'${module}'*`,
                                        color: global.colors.standby,
                                    }),
                                ],
                                fetchReply: true,
                            }).then((message) => {
                                this.moduleManager.enable(module).then(() => {
                                    const embed = new discord_js_1.EmbedBuilder({
                                        title: `Module *'${module}'* has been enabled`,
                                        color: global.colors.success,
                                    });
                                    if (message instanceof discord_js_1.Message) {
                                        message.edit({ embeds: [embed] });
                                    }
                                    else {
                                        interaction.channel?.send({ embeds: [embed] });
                                    }
                                }).catch((error) => {
                                    let msg = `${(0, discord_js_1.codeBlock)(error.message)}`;
                                    if (!(error instanceof Errors_1.ModuleLoadFail)) {
                                        msg = msg + `\n${(0, discord_js_1.codeBlock)(error.stack)}`;
                                    }
                                    const embed = new discord_js_1.EmbedBuilder({
                                        title: `Failed to enable module *'${module}'*`,
                                        description: msg,
                                        color: global.colors.error,
                                    });
                                    if (message instanceof discord_js_1.Message) {
                                        message.edit({ embeds: [embed] });
                                    }
                                    else {
                                        interaction.channel?.send({ embeds: [embed] });
                                    }
                                });
                            });
                        }
                        else {
                            throw new Error("No module specified");
                        }
                        break;
                    }
                    case "disable": {
                        logger_1.Logger.debug(`User ${interaction.user.username} is disabling module ${interaction.options.getString("module")}`);
                        const module = interaction.options.getString("module");
                        if (module) {
                            interaction.reply({
                                embeds: [
                                    new discord_js_1.EmbedBuilder({
                                        title: `Attempting to disable module *'${module}'*`,
                                        color: global.colors.standby,
                                    }),
                                ],
                                fetchReply: true,
                            }).then((message) => {
                                this.moduleManager.disable(module).then(() => {
                                    const embed = new discord_js_1.EmbedBuilder({
                                        title: `Module '${module}' has been disabled`,
                                        color: global.colors.success,
                                    });
                                    if (message instanceof discord_js_1.Message) {
                                        message.edit({ embeds: [embed] });
                                    }
                                    else {
                                        interaction.channel?.send({ embeds: [embed] });
                                    }
                                }).catch((error) => {
                                    let msg = `${(0, discord_js_1.codeBlock)(error.message)}`;
                                    if (!(error instanceof Errors_1.ModuleLoadFail)) {
                                        msg = msg + `\n${(0, discord_js_1.codeBlock)(error.stack)}`;
                                    }
                                    const embed = new discord_js_1.EmbedBuilder({
                                        title: `Failed to disable module *'${module}'*`,
                                        description: msg,
                                        color: global.colors.error,
                                    });
                                    if (message instanceof discord_js_1.Message) {
                                        message.edit({ embeds: [embed] });
                                    }
                                    else {
                                        interaction.channel?.send({ embeds: [embed] });
                                    }
                                });
                            });
                        }
                        else {
                            throw new Error("No module specified");
                        }
                        break;
                    }
                }
            },
        },
    ];
}
// type moduleData = {
//   name: string,
//   description: string,
//   depends_on?: string[],
//   version: string,
//   author: string | string[],
//   unload?: (client: Client) => void;
// }
