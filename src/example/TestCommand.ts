import { ApplicationCommandData, RESTPostAPIApplicationCommandsJSONBody, ChatInputCommandInteraction, CacheType, AutocompleteInteraction, ApplicationCommandOptionType } from "discord.js"
import { BotCommand, Client } from "../main"

export default class TestCommand implements BotCommand {

  private readonly bot: Client
  constructor(bot: Client) {
    this.bot = bot
  }

  cmd_data: ApplicationCommandData = {
    name: "set_status",
    description: "Set a test status",
    options: [
      {
        name: "status",
        description: "The new status",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  }
  public async callback(interaction: ChatInputCommandInteraction<CacheType>) {
    const status = interaction.options.getString("status", true)
    this.bot.user?.setActivity({
      name: status,
    })
    await interaction.reply("Updated bot's status")
  }
  name = "Status test command"

}
