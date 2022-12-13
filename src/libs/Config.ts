import { existsSync, mkdirSync, writeFile, writeFileSync } from "fs"
import { join } from "path"
import { Logger } from "./logger"

const PATH = join(__dirname, "../config/")

export function loadFolder(): boolean {
  if (!existsSync(PATH)) {
    try {
      mkdirSync(PATH)
      return true
    } catch (error) {
      Logger.severe("Unable to create config directory aborting start")
      Logger.warn(`${error}`)
      return false
    }
  }

  return true
}

export default class Config<T> {
  public readonly path
  public readonly default: T
  public readonly name: string
  public data: T

  /**
   * Creates a config file object, used to manage the config file
   * @param name the name of the file (no file extension)
   * @param defaultConfig The default content used to create the rile
   */
  constructor(name: string, defaultConfig: T) {
    //save values
    this.name = name
    this.default = defaultConfig
    this.data = this.default
    this.path = join(PATH, `${this.name}.json`)

    if (!existsSync(this.path)) {
      // if it does not log to Logger as warn and try to create it
      Logger.warn(`Failed to find config file ${this.name}.json, creating a new one`)
      this.save(true)
    } else {
      this.load()
    }

  }

  /**
   * Loads the config file
   * @param exitOnFail will force the box to exit abruptly if it fails to load
   */
  load(exitOnFail = false) {
    //check its not already loaded and remove it
    if (require.cache[this.path]) {
      delete require.cache[this.path]
    }

    try {
      this.data = require(this.path)
    } catch (error) {
      Logger.warn(`Failed to load file ${this.name}.json. ${error}`)
      this.data = this.default
      if (exitOnFail) {
        Logger.severe(`Exciting bot due to failure to load ${this.name}.json`)
        process.exit(1)
      }
    }
  }

  /**
   * Saves the config file
   * @param exitOnFail Aborts the program if the file fails to save
   */
  save(exitOnFail = false): Promise<void> {
    return new Promise((resolve, reject) => {
      writeFile(this.path, JSON.stringify(this.data, null, 4), (err) => {
        if (err) {
          Logger.warn(`Failed to create ${this.name}.json: ${err}`)
          Logger.severe(`Failed to create config file ${this.name}.json`)
          if (exitOnFail) {
            process.exit(1)
          }
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

}
