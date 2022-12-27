import ModuleBase from "./types/Module";
import InteractionManager from "./InteractionManager";
import Client from "../../main";
export default class ModuleManager {
    private enabledModules;
    modules: Set<string>;
    readonly interactionManager: InteractionManager;
    private readonly PATH;
    private client;
    private config;
    constructor(client: Client, path: string);
    /**
     * Will initialize all the bots modules, must be called on load
     */
    init(): Promise<boolean>;
    /**
     * Enable a module
     * @param id The id of the module to enable
     */
    enable(id: string): Promise<void>;
    /**
     * Disable a module
     * @param id The id of the module to disable
     */
    disable(id: string, calledBy?: string[]): Promise<void>;
    /**
     * Unload all modules
     */
    unloadAll(): Promise<void>;
    /**
     * Will reload all the loaded modules
     * @param clearOldCommands if when fetching the cache if old commands should be removed
     */
    reload(clearOldCommands?: boolean): Promise<void>;
    /**
     * Gets all the enabled modules
     * @returns Enabled modules
     */
    getEnabledModules(): Map<string, ModuleBase>;
    /**
     * Gets all the enabled modules
     * @returns Enabled modules
     */
    getDisabledModules(): Promise<Map<string, ModuleBase>>;
    /**
     * Enables/ Loads a module
     * @param id The id of the module
     * @param modules The modules to load under the ID
     * @returns If the modules were loaded
    */
    load(id: string, module: ModuleBase): Promise<boolean>;
    private isModule;
    /**
     * Gets a module from its folder
     * @param id The id of the module
     * @returns An array of the modules found within the folder
    */
    private fetchModule;
    /**
     * Unloads a module
     * @param id The id of the module
     * @returns If the module was unloaded
     */
    private unload;
    /**
     * Used to validate module ids, must match regex '^\w{3,}$'
     * @param id The id to validate
     * @param
     * @returns If the id is valid
     */
    private validateID;
}
