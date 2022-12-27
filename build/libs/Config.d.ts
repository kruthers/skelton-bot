export declare function loadFolder(): boolean;
export default class Config<T> {
    static PATH: string;
    readonly default: T;
    readonly name: string;
    data: T;
    /**
     * Creates a config file object, used to manage the config file
     * @param name the name of the file (no file extension)
     * @param defaultConfig The default content used to create the rile
     * @param autoLoad Automatically save/ load the file once created
     */
    constructor(name: string, defaultConfig: T, autoLoad?: boolean);
    private getPath;
    /**
     * Loads the config file
     * @param exitOnFail will force the box to exit abruptly if it fails to load
     */
    load(exitOnFail?: boolean): Promise<void>;
    /**
     * Saves the config file
     * @param exitOnFail Aborts the program if the file fails to save
     */
    save(exitOnFail?: boolean): Promise<void>;
}
