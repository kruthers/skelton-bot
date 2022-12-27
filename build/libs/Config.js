"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFolder = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const logger_1 = require("./logger");
function loadFolder() {
    if (!(0, fs_1.existsSync)(Config.PATH)) {
        try {
            (0, fs_1.mkdirSync)(Config.PATH);
            return true;
        }
        catch (error) {
            logger_1.Logger.severe("Unable to create config directory aborting start");
            logger_1.Logger.warn(`${error}`);
            return false;
        }
    }
    return true;
}
exports.loadFolder = loadFolder;
class Config {
    static PATH = (0, path_1.join)(__dirname, "../config/");
    path;
    default;
    name;
    data;
    /**
     * Creates a config file object, used to manage the config file
     * @param name the name of the file (no file extension)
     * @param defaultConfig The default content used to create the rile
     * @param autoLoad Automatically save/ load the file once created
     */
    constructor(name, defaultConfig, autoLoad = true) {
        //save values
        this.name = name;
        this.default = defaultConfig;
        this.data = this.default;
        this.path = (0, path_1.join)(Config.PATH, `${this.name}.json`);
        if (autoLoad)
            this.load();
    }
    /**
     * Loads the config file
     * @param exitOnFail will force the box to exit abruptly if it fails to load
     */
    async load(exitOnFail = false) {
        //check its not already loaded and remove it
        if (require.cache[this.path]) {
            delete require.cache[this.path];
        }
        if ((0, fs_1.existsSync)(this.path)) {
            try {
                this.data = require(this.path);
            }
            catch (error) {
                logger_1.Logger.warn(`Failed to load file ${this.name}.json. ${error}`);
                this.data = this.default;
                if (exitOnFail) {
                    logger_1.Logger.severe(`Exciting bot due to failure to load ${this.name}.json`);
                    process.exit(1);
                }
            }
        }
        else {
            this.data = this.default;
        }
        await this.save(exitOnFail);
    }
    /**
     * Saves the config file
     * @param exitOnFail Aborts the program if the file fails to save
     */
    save(exitOnFail = false) {
        return new Promise((resolve, reject) => {
            (0, fs_1.writeFile)(this.path, JSON.stringify(this.data, null, 4), (err) => {
                if (err) {
                    logger_1.Logger.warn(`Failed to create ${this.name}.json: ${err}`);
                    logger_1.Logger.severe(`Failed to create config file ${this.name}.json`);
                    if (exitOnFail) {
                        process.exit(1);
                    }
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
}
exports.default = Config;
