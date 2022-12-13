import { Client, Message } from "discord.js"
import { Logger } from "./libs/logger"
import Config, { loadFolder } from "./libs/Config"
import { ModuleManager } from "./libs/ModuleManager/main"
import { GatewayIntentBits } from "discord-api-types/v10"

/**
 * Initialize variables
 */
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.MessageContent,
  ],
})

const moduleManager = new ModuleManager(bot)

/**
 * Bot Event managers
 */
bot.on("disconnect", () => {
  Logger.severe("Disconnected from Discord")
  process.exit()
})

bot.on("messageCreate", (message: Message) => {
  if (message.author.id !== bot.user?.id) {
    Logger.message(message)
  }
})

bot.once("ready", async () => {
  Logger.info("Connected to Discord")
  Logger.info("Loading modules")
  // await moduleManager.commandManager.clearBotCommands(); //DEBUG

  await moduleManager.init()

  Logger.info("Bot is now running")
});

/**
 * Core code
 * Will start the bot and the main process
 */
(async () => {
  Logger.info("Starting Bot...")

  //load the config DIR
  if (!loadFolder()) {
    setTimeout(() => {
      process.exit(2)
    }, 100)
    return
  }

  Logger.info("Loading core config")
  //Load the core config
  const config = new Config<core_config>("core", {
    token: "REPLACE_ME",
    log: {
      level: "info",
      messages: false,
      commands: false,
    },
  })

  //validate log level
  if (![ "info", "debug", "silly" ].includes(config.data.log.level)) {
    Logger.warn("Invalid level set in /config/core.json must either info/debug/silly")
    config.data.log.level = "info"
  }

  global.log = config.data.log
  Logger.transports.console.level = global.log.level


  Logger.info("Core config loaded")

  // see if message logging is on
  // Does not do anything right now, need to update the log transports used TODO
  if (global.log.messages) {
    Logger.warn("Message logging is enabled! This is not supported and should only be used for testing.".yellow)
  }

  // load the token and ensure it is set
  if (config.data.token == "" || config.data.token == "REPLACE_ME") {
    Logger.warn("No token provided in \"/config/core.json please set before starting the bot")
    Logger.severe("Invalid token provided, failed to start bot")
    setTimeout(() => {
      process.exit(2)
    }, 100)
    return
  }

  Logger.info("Attempting to log in..")
  bot.login(config.data.token)

})()


const exit_events: string[] = [ "SIGINT", "SIGUSR1", "SIGUSR2", "SIGTERM" ]
exit_events.forEach((event) => {
  process.on(event, async () => {
    Logger.severe("Force Exit event detected")
    Logger.info("Unloading modules")
    await moduleManager.unloadAll()
    Logger.info("Modules unloaded")
    Logger.warn("Terminating bot")
    bot.destroy()
    Logger.severe("Bot processes ended, good bye o/")
    process.exit(2)
  })
})
