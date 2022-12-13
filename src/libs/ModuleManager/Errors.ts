import { APIEmbed, ChatInputCommandInteraction, EmbedBuilder, Interaction } from "discord.js"

export class InteractionException extends Error {
  constructor (msg = "Failed to process interaction: An unknown exception occurred", public logStack = false) {
    super(msg)
  }
}

export class CommandException extends InteractionException {
  constructor (msg = "An unknown exception occurred", logStack = false) {
    super(`Failed to execute command: ${msg}`, logStack)
  }
}

export class ButtonException extends InteractionException {
  constructor (msg = "An unknown exception occurred", logStack = false) {
    super(`Failed to process button: ${msg}`, logStack)
  }
}

export class ModalException extends InteractionException {
  constructor (msg = "An unknown exception occurred", logStack = false) {
    super(`Failed to process modal: ${msg}`, logStack)
  }
}

export class UnknownCommandException extends CommandException {
  constructor() {
    super("Command does not exist on bot", false)
  }
}

export class UnknownSubCommandException extends CommandException {
  constructor(interaction: ChatInputCommandInteraction) {
    const subGroup = interaction.options.getSubcommandGroup()
    if (subGroup) {
      super(`Sub command ${subGroup} ${interaction.options.getSubcommand()} does not exist.`)
    } else {
      super(`Sub command ${interaction.options.getSubcommand()} does not exist.`)
    }
  }
}

export function getErrorEmbed(name: string, message: string, interaction: Interaction): APIEmbed {
  if (message.indexOf("`") < 0) {message = "`" + message + "`"}
  const error = new EmbedBuilder()
    .setTitle("Interaction exception")
    .setDescription(message)
    .setTimestamp(interaction.createdTimestamp)
    .setFooter({
      text: `Interaction: ${name}`,
      iconURL: "https://cdn.discordapp.com/emojis/483993897115189287.png?v=1",
    })
    .setColor(global.colours.error)

  if (interaction.isChatInputCommand()) {
    error.setTitle("Command Exception")
    error.setFooter({
      text: `Command: ${name}`,
      iconURL: "https://cdn.discordapp.com/emojis/483993897115189287.png?v=1",
    })
  } else if (interaction.isButton()) {
    error.setTitle("Button Exception")
    error.setFooter({
      text: `Button: ${name}`,
      iconURL: "https://cdn.discordapp.com/emojis/483993897115189287.png?v=1",
    })
  } else if (interaction.isModalSubmit()) {
    error.setTitle("Modal Exception")
    error.setFooter({
      text: `Modal: ${name}`,
      iconURL: "https://cdn.discordapp.com/emojis/483993897115189287.png?v=1",
    })
  }

  return error.toJSON()
}

export class ModuleLoadFail extends Error {
  constructor(name: string, msg: unknown = "A unexpected error occurred") {
    super(`Failed to load module ${name}: ${msg}`)
  }
}
