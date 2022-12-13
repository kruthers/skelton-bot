import { CommandInteraction } from "discord.js"

type commandData = {
  id: string,
  module: string,
  name: string,
  callback(interaction: CommandInteraction): void,
}

type genericData<T> = {
  id: string,
  module: string,
  callback(interaction: T): void,
}
