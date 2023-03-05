/* eslint-disable no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import { ApplicationCommandData, AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, ModalSubmitInteraction, RESTPostAPIApplicationCommandsJSONBody, SelectMenuInteraction } from "discord.js"
import BotClient from "../../../BotClient"

export default abstract class ModuleBase {
  /**
   * The name of the module
   */
  public readonly name!: string

  /**
   * Any Required module the module has
   */
  public readonly depend_on?: string[]

  /**
   * The module's development version
   */
  public readonly version!: string

  /**
   * Short description of what the module is / does
   */
  public readonly description!: string

  /**
   * The author(s) of the module
   */
  public readonly author!: string | string[]

  /**
   * Module's Commands
   */
  public readonly commands?: BotCommand[]

  /**
   * Buttons
   * Any buttons used in your module
   * <id, callback>
   */
  public readonly buttons?: Map<string, (interaction: ButtonInteraction) => void>

  /**
  * Modals (forms)
  * Any forms used by your module
  * <id, callback>
  */
  public readonly modals?: Map<string, (interaction: ModalSubmitInteraction) => void>

  /**
  * Menus
  * Any forms used by your module
  * <id, callback>
  */
  public readonly menus?: Map<string, (interaction: SelectMenuInteraction) => void>

  /**
   * Loads the module's resources into the main system
   * @param bot The discord bot client
   */
  // load(bot: Client): void {}
  load?: (client: BotClient) => Promise<void> | void

  /**
   * UnLoads the module's resources into the main system
   * @param bot The discord bot client
   */
  // unload(bot: Client): void {}
  unload?: (client: BotClient) => Promise<void> | void
}

export type BotCommand = {
  cmd_data: ApplicationCommandData | RESTPostAPIApplicationCommandsJSONBody;
  function: (interaction: ChatInputCommandInteraction) => void;
  name: string;
  autoComplete?: (interaction: AutocompleteInteraction) => void | undefined;
}
