import { Client, Message } from "discord.js"
import { join } from "path"
import Config, { loadFolder } from "./libs/Config"
import { Logger, startLogger } from "./libs/logger"
import ModuleManager from "./libs/ModuleManager/main"
import ModuleBase from "./libs/ModuleManager/types/Module"

export default class BotClient extends Client {
  private readonly forcedToken: string | undefined
  private readonly name: string

  private config = new Config<core_config>("core", {
    token: "REPLACE_ME",
    log: {
      level: "info",
      messages: false,
      commands: false,
    },
  }, false)

  private exiting = false

  private readonly moduleManager

  constructor(options: botOptions) {
    super({
      intents: options.intents,
    })

    startLogger(join(options.base_folder, "./logs/"))
    this.moduleManager = new ModuleManager(this, join(options.base_folder, "./modules/"))
    Config.PATH = join(options.base_folder, "./config/")

    this.forcedToken = options.token
    this.name = options.name


    //add listeners
    this.on("disconnect", () => {
      Logger.severe("Disconnected from Discord")
      process.exit()
    })
    this.on("messageCreate", (message: Message) => {
      if (message.author.id !== this.user?.id) {
        Logger.message(message)
      }
    })
    this.once("ready", async () => {
      Logger.info("Connected to Discord")
      Logger.info("Loading modules")
      // await moduleManager.commandManager.clearBotCommands(); //DEBUG

      await this.moduleManager.init()

      Logger.info(`${this.name} is now online and running!`)
      Logger.info("Bot is now running")
    })

    const exit_events: string[] = [ "SIGINT", "SIGUSR1", "SIGUSR2", "SIGTERM", "exit" ]
    exit_events.forEach((event) => {
      process.on(event, async () => {
        if (this.exiting) return
        this.exiting = true
        Logger.severe("Exit event detected")
        Logger.info("Unloading modules")
        await this.moduleManager.unloadAll()
        Logger.info("Modules unloaded")
        Logger.warn("Terminating bot")
        this.destroy()
        Logger.info(`${this.name} processes ended, good bye o/`)
        Logger.severe("Bot now offline")
        process.exit()
      })
    })
  }

  async start() {
    Logger.info(`Starting ${this.name}...`)

    //load the config DIR
    if (!loadFolder()) {
      setTimeout(() => {
        process.exit(2)
      }, 100)
      return
    }

    Logger.info("Loading core config")
    //make sure the main config is loaded
    await this.config.load()

    //validate log level
    if (![ "info", "debug", "silly" ].includes(this.config.data.log.level)) {
      Logger.warn("Invalid level set in /config/core.json must either info/debug/silly")
      this.config.data.log.level = "info"
    }

    global.log = this.config.data.log
    Logger.transports.console.level = global.log.level


    Logger.info("Core config loaded")

    // see if message logging is on
    // Does not do anything right now, need to update the log transports used TODO
    if (global.log.messages) {
      Logger.warn("Message logging is enabled! This is not supported and should only be used for testing.".yellow)
    }

    //handle token
    if (this.forcedToken) {
      Logger.severe("A forced token is in use, it is not recommended to use a forced token in your main functions")
      Logger.info("Attempting to log in..")
      this.login(this.forcedToken)
    } else {
      // load the token and ensure it is set
      if (this.config.data.token == "" || this.config.data.token == "REPLACE_ME") {
        Logger.warn("No token provided in \"/config/core.json please set before starting the bot")
        Logger.severe("Invalid token provided, failed to start bot")
        setTimeout(() => {
          process.exit(2)
        }, 100)
        return
      }

      Logger.info("Attempting to log in..")
      this.login(this.config.data.token)
    }
  }

  loadModule(id: string, module: ModuleBase): Promise<boolean> {
    return this.moduleManager.load(id, module)
  }

}