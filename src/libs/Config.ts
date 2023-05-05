import { existsSync, mkdirSync, readFileSync, writeFile } from "fs"
import { join } from "path"
import { Logger } from "./logger"

export function loadFolder(): boolean {
  if (!existsSync(Config.PATH)) {
    try {
      mkdirSync(Config.PATH)
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
  public static PATH: string

  public readonly default: T
  public readonly name: string
  public data: T

  /**
   * Creates a config file object, used to manage the config file
   * @param name the name of the file (no file extension)
   * @param defaultConfig The default content used to create the rile
   * @param autoLoad Automatically save/ load the file once created
   */
  constructor(name: string, defaultConfig: T, autoLoad = true) {
    //save values
    this.name = name
    this.default = defaultConfig
    this.data = this.default

    if (autoLoad) this.load()
  }


  private getPath(): string {
    return join(Config.PATH, `${this.name}.json`)
  }

  /**
   * Loads the config file
   * @param exitOnFail will force the box to exit abruptly if it fails to load
   */
  async load(exitOnFail = false) {
    //check its not already loaded and remove it
    if (require.cache[this.getPath()]) {
      delete require.cache[this.getPath()]
    }

    if (existsSync(this.getPath())) {
      try {
        const fileData = readFileSync(this.getPath(), "utf8")
        this.data = JSON.parse(fileData)
      } catch (error) {
        Logger.warn(`Failed to load file ${this.name}.json. ${error}`)
        this.data = this.default
        if (exitOnFail) {
          Logger.severe(`Exciting bot due to failure to load ${this.name}.json`)
          process.exit(1)
        }
      }
    } else {
      this.data = this.default
    }
    await this.save(exitOnFail)
  }

  /**
   * Saves the config file
   * @param exitOnFail Aborts the program if the file fails to save
   */
  save(exitOnFail = false): Promise<void> {
    return new Promise((resolve, reject) => {
      writeFile(this.getPath(), JSON.stringify(this.data, null, 4), (err) => {
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
