import { ApplicationCommand, AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, Client, CommandInteraction, Interaction, ModalSubmitInteraction, SelectMenuInteraction } from "discord.js"
import { BotCommand } from "./types/Module"
import { Logger } from "../logger"
import { getErrorEmbed, InteractionException, UnknownCommandException } from "./Errors"
import { commandData, genericData } from "./types/interactionManagerData"


export default class InteractionManager {
  private client: Client

  //interactions
  private commands: Map<string, commandData> = new Map()
  private buttons: Map<string, genericData<ButtonInteraction>> = new Map()
  private modals: Map<string, genericData<ModalSubmitInteraction>> = new Map()
  private selectMenus: Map<string, genericData<SelectMenuInteraction>> = new Map()

  constructor(client: Client) {
    this.client = client
  }

  public async onInteraction(interaction: Interaction) {
    let type = "Interaction"
    let name = "Unknown"

    try {
      if (interaction.isChatInputCommand()) {
        type = "Command"
        name = interaction.commandName
        await this.processCommand(interaction)

      } else if (interaction.isButton()) {
        type = "Button"
        name = interaction.customId
        await this.processButton(interaction)

      } else if (interaction.isModalSubmit()) {
        type = "Modal"
        name = interaction.customId
        await this.processModal(interaction)

      } else if (interaction.isSelectMenu()) {
        type = "Select Menu"
        name = interaction.customId
        await this.processSelectMenu(interaction)

      } else if (interaction.isAutocomplete()) {
        type = "Auto Complete"
        name = interaction.commandName
        await this.processAutoComplete(interaction)

      } else {
        Logger.warn("Interaction type not yet processed by bot")
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      Logger.warn("Caught interaction processing error")
      if (!(interaction.isChatInputCommand() || interaction.isButton() || interaction.isModalSubmit() || interaction.isSelectMenu())) return
      Logger.warn(`${type} ${name} failed to execute for ${interaction.user.username}`)

      let embed = getErrorEmbed(name, "An unexpected error occurred:\n```" + error.name + ": " + error.stack + "```", interaction)
      if (error instanceof InteractionException) {
        let msg = error.message
        if (error.logStack) {
          msg = error.message + ":\n ```" + error.stack + "```"
        }

        embed = getErrorEmbed(name, msg, interaction)
      } else {
        embed = getErrorEmbed(name, "An unexpected error occurred:\n```" + error.name + ": " + error.stack + "```", interaction)
      }

      //either reply or edit the reply to the message
      if (interaction.replied || interaction.deferred) {
        interaction.editReply({ embeds: [ embed ] })
      } else {
        interaction.reply({ embeds: [ embed ], ephemeral: true })
      }
    }
  }

  /**
   * Process a command interaction
   * @param interaction the interaction to process as command
   */
  //processes a command interaction
  public async processCommand(interaction: ChatInputCommandInteraction) {
    const commandName = interaction.commandName

    const command = this.commands.get(commandName)
    if (global.log.commands) Logger.info(`${interaction.user.username} ran command ${commandName}`)

    //check the command exists
    if (!command) {
      Logger.warn(`Command ${commandName} not found`)
      this.refreshCommandCache(true)

      throw new UnknownCommandException()
    }

    //execute the command
    await command.callback(interaction)
  }

  /**
   * Process a command interaction
   * @param interaction the interaction to process as command
   */
  //processes a command interaction
  public async processAutoComplete(interaction: AutocompleteInteraction) {
    const commandName = interaction.commandName
    const command = this.commands.get(commandName)

    //check the command exists
    if (!command) {
      Logger.warn(`Command ${commandName} not found`)
      this.refreshCommandCache(true)
    } else if (command.autoComplete) {
      //execute the command
      command.autoComplete(interaction)
    }
  }

  /**
   * Will refresh the clients cache of commands by fetching them all
   * @param removeOld If old command should be removed from the bot
   */
  //will fetch all commands from discord to update the local cache
  public async refreshCommandCache(removeOld: boolean) {

    const commands = await this.client.application?.commands.fetch()

    if (removeOld) {
      commands?.forEach(command => {
        if (!this.commands.has(command.name)) {
          Logger.warn(`Found old command ${command.name}, removing from bot`)
          this.client.application?.commands.delete(command).then(() => {
            Logger.debug(`Command ${command.name} removed from bot`)
          }).catch((error) => {
            Logger.warn(`Failed to remove ${command.name} from application: ${error}`)
          })
        }
      })
    }

  }

  /**
   * Add a command to the command manager
   * @param command The command to add
   * @param moduleID The id of the module the command originated from
   */
  // converts the bot command and module id into a command data object and adds it to the commands map (name comes from command.cmd_data.name)
  public addCommand(command: BotCommand, moduleID: string): void {
    Logger.debug(`Adding command ${command.name} to command manager`)
    const cmdData: commandData = {
      id: command.cmd_data.name,
      module: moduleID,
      name: command.name,
      callback: command.function,
      autoComplete: command.autoComplete,
    }

    const app = this.client.application
    let isOldCommand = false

    app?.commands.cache.forEach((oldCmd: ApplicationCommand) => {
      if (oldCmd.name == command.cmd_data.name) {
        Logger.debug(`Command ${command.name} already exits on the bot as ID ${oldCmd.id}`)
        //mark it as being an old command
        isOldCommand = true

        //attempt to edit the old version, with the new version
        app.commands.edit(oldCmd, command.cmd_data).then(() => {
          Logger.info(`Successfully updated command ${command.name}. (CMD ID ${oldCmd.id})`)

          //save the command data into command
          this.commands.set(cmdData.id, cmdData)
        }).catch((error) => {
          Logger.warn(`Failed to update old bot command ${command.name}, id: ${oldCmd.id}. Error:\n ${error}`)
        })
      }
    })

    //if there was no old version found, add the command as a new command
    if (!isOldCommand) {
      app?.commands.create(command.cmd_data).then((cmd) => {
        this.commands.set(cmdData.id, cmdData)
        Logger.info(`Successfully added command ${command.name}. (CMD ID ${cmd.id})`)
      })
    }
  }

  /**
   * Remove a command from the command manager
   * @param commandID The id of the command to get
  */
  //remove a command from the array (if it has it) and remove it from the bot
  public removeCommand(name: string): void {
    if (this.commands.has(name)) {

      const app = this.client.application
      app?.commands.cache.forEach((cmd: ApplicationCommand) => {
        if (cmd.name == name) {
          app.commands.delete(cmd).then(() => {
            Logger.info(`Successfully removed command ${name}. (CMD ID ${cmd.id})`)
            this.commands.delete(name)
          }).catch((error) => {
            Logger.warn(`Failed to remove command ${name} from application: ${error}`)
          })
        }
      })
    }
  }

  /**
   * Removes all commands from the bot
   * @deprecated Debugging only
  */
  //clears all commands from the bot
  public async clearBotCommands() {
    const app = this.client.application
    Logger.warn("Removing all commands from bot")
    const commands = await app?.commands.fetch()

    if (!commands) {
      Logger.debug("Got no commands on bot")
      return
    }

    for (const cmd of commands) {
      Logger.debug(`Removing command ${cmd[1].name}, (ID: ${cmd[0]})`)
      await app?.commands.delete(cmd[0])
      Logger.info(`Removed command ${cmd[1].name}, (ID: ${cmd[0]})`)
    }

    Logger.warn("All commands removed")
  }

  /**
   * Removes all interactions related to a set module
   * @param moduleID module to process
   */
  //removes all commands, buttons, modals, extra related to a module id
  public async removeModuleData(moduleID: string) {
    Logger.debug(`Removing commands, modals and buttons from ${moduleID}`)

    this.buttons.forEach((data, id) => {
      if (data.module == moduleID) {
        this.removeCommand(id)
      }
    })

    this.buttons.forEach((data, id) => {
      if(data.module == moduleID) {
        this.buttons.delete(id)
      }
    })

    this.modals.forEach((data, id) => {
      if(data.module == moduleID) {
        this.modals.delete(id)
      }
    })
  }

  /**
   * Adds a button interaction with a function
   * @param id the id of the button
   * @param callback function to call if the interaction is triggered
   */
  //adds a button id to monitor for interactions
  public async addButtonInteraction(id: string, callback: (interaction: ButtonInteraction) => void, moduleID: string) {
    const data: genericData<ButtonInteraction> = {
      id: id,
      callback: callback,
      module: moduleID,
    }

    this.buttons.set(id, data)
  }

  /**
   * Process a button interaction
   * @param interaction the interaction to process
   */
  //Process a button
  public async processButton(interaction: ButtonInteraction) {
    const name = interaction.customId
    Logger.debug(`${interaction.user.username} used button ${name} in ${interaction.guild?.name ?? "@" + interaction.user.username}`)
    const button = this.buttons.get(name)

    if (button) {
      button.callback(interaction)
    }
  }

  /**
   * Adds a modal interaction with a function
   * @param id the id of the modal
   * @param callback function to call if the modal is triggered
   */
  //adds a modal id to monitor for interactions
  public async addModalInteraction(id: string, callback: (interaction: ModalSubmitInteraction) => void, moduleID: string) {
    const data: genericData<ModalSubmitInteraction> = {
      id: id,
      callback: callback,
      module: moduleID,
    }

    this.modals.set(id, data)
  }

  /**
   * Process a modal submit interaction
   * @param interaction the interaction to process
   */
  //Process a submitted modal
  public async processModal(interaction: ModalSubmitInteraction) {
    const name = interaction.customId
    Logger.debug(`${interaction.user.username} submitted modal ${name} in ${interaction.guild?.name ?? "@" + interaction.user.username}`)
    const modal = this.modals.get(name)

    if (modal) {
      modal.callback(interaction)
    }
  }

  /**
   * Adds a selection menu interaction with a function
   * @param id the id of the modal
   * @param callback function to call if the modal is triggered
   */
  //adds a select menu id for interactions
  public async addSelectMenuInteraction(id: string, callback: (interaction: SelectMenuInteraction) => void, moduleID: string) {
    const data: genericData<SelectMenuInteraction> = {
      id: id,
      callback: callback,
      module: moduleID,
    }

    this.selectMenus.set(id, data)
  }

  /**
   * Process a select menu submit interaction
   * @param interaction the interaction to process
   */
  //Process a select menu
  public async processSelectMenu(interaction: SelectMenuInteraction) {
    const name = interaction.customId
    Logger.debug(`${interaction.user.username} submit select menu ${name} in ${interaction.guild?.name ?? "@" + interaction.user.username}`)
    const selectMenu = this.selectMenus.get(name)

    if (selectMenu) {
      selectMenu.callback(interaction)
    }
  }

}


