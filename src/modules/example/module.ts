import { Client } from "discord.js"
import { Logger } from "../../libs/logger"
import ModuleBase, { BotCommand } from "../../libs/ModuleManager/types/Module"



export class ExampleModule implements ModuleBase {
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
      function: (interaction) => {
        interaction.reply("Pong")
      },
    },
  ]

  load(bot: Client): void {
    Logger.info("Hello wold, example module has been loaded")
    bot.user?.setPresence({ activities: [ { name: "Test" } ], status: "online" })
  }

  unload(): void {
    Logger.info("Example module has been unloaded")
  }


}
