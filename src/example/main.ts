import { GatewayIntentBits } from "discord-api-types/v10"
import { BotCommand, Client, Logger, ModuleBase } from "../main"
import TestCommand from "./TestCommand"

/**
 * Initialize variables
 */
const bot = new Client({
  name: "Test Bot",
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
  base_folder: __dirname,
})

bot.on("reload", () => {
  bot.loadModule("example", new ExampleModule())
})

bot.start()


class ExampleModule implements ModuleBase {
  public readonly name: string = "Example Module"
  public readonly version: string = "1.0.0"
  public readonly description: string = "A example/ test module used to show case the bots features"
  public readonly author: string | string[] = "kruthers"
  public readonly commands: BotCommand[] = [
    {
      name: "Ping Command",
      cmd_data: {
        name: "ping",
        description: "Will say pong",
      },
      callback: (interaction) => {
        interaction.reply("Pong")
      },
    },
  ]

  async load(bot: Client) {
    Logger.info("Hello wold, example module has been loaded")
    this.commands.push(new TestCommand(bot))
  }

  async unload() {
    Logger.info("Example module has been unloaded")
  }


}
