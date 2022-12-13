import { APIEmbed, ApplicationCommandOptionType, ApplicationCommandType, Client, codeBlock, EmbedBuilder, EmbedField, Message } from "discord.js"
import { existsSync, readdirSync } from "fs"
import { join } from "path"
import ModuleBase, { BotCommand } from "./types/Module"
import Config from "../Config"
import { Logger } from "../logger"
import { StringIteratorToSting, StringSetToSting } from "../StringUtils"
import InteractionManager from "./InteractionManager"
import { ModuleLoadFail } from "./Errors"


export class ModuleManager {

  //All enabled modules
  private enabledModules: Map<string, ModuleBase[]> = new Map

  //List of all module ids
  public modules: Set<string> = new Set()

  //command manager
  public readonly interactionManager: InteractionManager

  private readonly PATH = join(__dirname, "../../modules/")

  private client: Client

  private config: Config<moduleConfig> = new Config(
    "modules",
    {
      response_deletion_time: 15000,
      colours: {
        error: 15747399,
        success: 6549575,
        warn: 16763481,
        standby: 10395294,
        neutral: 3259125,
      },
      disabled: [],
    },
  )


  constructor(client: Client) {
    this.client = client
    this.interactionManager = new InteractionManager(client)
  }


  /**
   * Will initialize all the bots modules, must be called on load
   */
  async init(): Promise<boolean> {
    if (this.modules.size !== 0) {
      Logger.warn("Warning tried to re-initialize an already initialized module manager, aborting initialization")
      return false
    }

    await this.reload().catch(error => {
      Logger.severe(`Failed to initialize module manager: ${error}`)
      return false
    })

    await this.config.load()
    global.colours = this.config.data.colours
    global.colors = global.colours

    return true
  }

  /**
   * Enable a module
   * @param id The id of the module to enable
   */
  public async enable(id: string) {
    if (!this.modules.has(id)) {
      throw new ModuleLoadFail(id, "Unable to enable: Module is not loaded")
    }

    if (this.enabledModules.has(id)) {
      throw new ModuleLoadFail(id, "Unable to enable: Module is already enabled")
    }

    const modules = await this.fetchModule(id)
    if (modules.length === 0) {
      throw new ModuleLoadFail(id, "Unable to enable: No modules provided")
    }

    if (this.config.data.disabled.includes(id)) {
      this.config.data.disabled = this.config.data.disabled.filter(disabled => disabled !== id)
      await this.config.save()
    }

    //load modules
    await this.load(id, modules)

  }

  /**
   * Disable a module
   * @param id The id of the module to disable
   */
  public async disable(id: string, calledBy: string[] = []) {
    if (!this.modules.has(id)) {
      throw new Error(`Unable to disable ${id}, module is not loaded`)
    }

    if (!this.enabledModules.has(id)) {
      throw new Error(`Unable to disable ${id}, module is not enabled`)
    }

    if (id == "default") {
      throw new Error(`Unable to disable ${id}, module is required for the bot to function`)
    }

    //disable children modules
    for (const info of this.enabledModules) {
      for (const module of info[1]) {
        if (module.depend_on?.includes(id)) {
          if (calledBy.includes(info[0])) {
            Logger.warn(`Circular dependency detected, modules ${info[0]} and ${id}`)
            break
          } else {
            await this.disable(info[0], [ ...calledBy, id ])
            break
          }
        }
      }
    }

    //Adds to disabled list
    this.config.data.disabled.push(id)
    //saves data
    await this.config.save()

    //unload modules
    await this.unload(id, true)
  }

  /**
   * Unload all modules
   */
  public async unloadAll() {
    for (const module of this.enabledModules) {
      try {
        await this.unload(module[0])
      } catch (err) {
        Logger.severe(`Failed to unload ${module[0]}. Will not attempt to reload it!`)
        Logger.warn(`${err}`)
        if (!this.config.data.disabled.includes(module[0])) {
          this.config.data.disabled.push(module[0])
          //saves data
          await this.config.save()
        }
      }
    }
  }

  /**
   * Will reload all the loaded modules
   * @param clearOldCommands if when fetching the cache if old commands should be removed
   */
  // works by first getting all the ids from the modules folder, then fetching them from the folders.
  // Then unload any loaded modules and then finlay load the modules in.
  public async reload(clearOldCommands = false) {
    Logger.warn("Reloading all modules")

    //check modules folder exists
    if (!existsSync(this.PATH)) {
      Logger.debug(`Failed to find directory ${this.PATH}`)
      throw new Error("Unable to find modules folder")
    }

    Logger.info("Unloading any loaded modules and clearing cache")

    //unload all modules
    await this.unloadAll()

    //clear modules from cache first
    Logger.debug("Clearing required cache")
    for (const required in require.cache) {
      if (required.startsWith(this.PATH)) {
        Logger.silly(`Removing requirement: '${required}'`)
        delete require.cache[required] // Remove the loaded module from node's cache
      }
    }
    Logger.debug("Cleared all modules from cache")

    Logger.debug("Getting all modules in modules folder")
    //Get all the modules
    const modulesIds = readdirSync(this.PATH)
    if (modulesIds.length === 0) {
      throw new Error("No modules found in modules folder")
    }

    Logger.info("Clearing Listener")
    this.client.removeAllListeners()

    Logger.info("Unloaded all modules, fetching all modules.")

    //get all modules
    let modulesInfo: moduleInfo[] = []
    for (const id of modulesIds) {
      //validate id
      if (this.validateID(id)) {
        Logger.debug(`Fetching module '${id}'`)
        //gets the modules from the folder
        const modules = await this.fetchModule(id)
        //check it has modules
        if (modules.length > 0) {
          //get all parents for the modules
          const parents: Set<string> = new Set()
          modules.forEach(module => {
            if (module.depend_on) {
              module.depend_on.forEach(parent => { parents.add(parent) })
            }
          })

          //save the information for the module
          const data: moduleInfo = {
            id: id,
            modules: modules,
            parents: parents,
          }
          modulesInfo.push(data)
          Logger.debug(`Registered module with id: ${id}`)
        } else {
          Logger.warn(`Unable to fetch module ${id}, no modules found in file`)
        }
      } else {
        Logger.warn(`Unable to fetch module "${id}", invalid id. ID must only contain letters, numbers, and underscores`)
      }
    }

    //update data from config/ refresh config
    this.config.load()

    //update colours
    global.colours = this.config.data.colours
    global.colors = global.colours

    //clear loaded modules and modules list
    this.modules = new Set(modulesInfo.map(data => data.id))
    this.enabledModules = new Map()

    //remove disabled modules
    for (const module of modulesInfo) {
      if (this.config.data.disabled.includes(module.id)) {
        removeModule(module.id)
      }
    }

    //load new modules in
    Logger.info("All modules fetched, loading modules")

    //load the default module
    Logger.debug("Loading default module first")
    await this.load("default", [ new DefaultModule(this) ])

    Logger.debug("Loaded default, sorting appendices")

    //functions to check dependencies are valid and are not circular
    function removeModule(id: string) {
      modulesInfo = modulesInfo.filter(module => module.id !== id)
    }

    function checkDecencies(module: moduleInfo, parents = new Set<string>()): boolean {
      Logger.silly(`Checking dependencies for module ${module.id}`)
      if (parents.has(module.id)) {
        removeModule(module.id)
        Logger.warn(`Circular dependency detected, removing module '${module.id}'`)
        return false
      }
      for (const parent of module.parents) {
        const parentModule = modulesInfo.find(m => m.id === parent)
        if (parentModule) {
          if (!checkDecencies(parentModule, parents)) {
            removeModule(module.id)
            Logger.warn(`Circular dependency detected, removing module '${module.id}'`)
            return false
          }
        } else {
          removeModule(module.id)
          Logger.warn(`Unable to find parent module ${parent} for module ${module.id}`)
          return false
        }
        parents.add(parent)
      }

      return true
    }

    //cycle though all modules checking they are all valid, will re-parse until they are all valid or there are no more modules to check
    let checked = 0
    while (checked < modulesInfo.length) {
      const module = modulesInfo[checked]
      if (module.parents.size === 0) {
        checked++
      } else if (checkDecencies(module)) {
        checked++
      } else {
        Logger.debug(`Unable to load module ${module.id}, restarting checks`)
        checked == 0
      }
    }

    //load all the modules
    let failed = 0
    while (modulesInfo.length > 0) {
      const module = modulesInfo[0]
      let goodToLoad = true
      for (const parent of module.parents) {
        if (!this.enabledModules.has(parent) && goodToLoad) {
          goodToLoad = false
        }
      }

      if (goodToLoad) {
        try {
          Logger.debug(`Loading module ${module.id}`)
          //load the module
          await this.load(module.id, module.modules)
          Logger.info(`Successfully loaded module ${module.id}`)
        } catch (err) {
          if (err instanceof ModuleLoadFail) {
            Logger.severe(`${err}`)
          } else {
            Logger.severe(`${new ModuleLoadFail(`${err}`)}`)
          }
        }
        modulesInfo.shift()
        failed = 0
      } else {
        modulesInfo.push(module)
        modulesInfo.shift()
        failed++

        if (failed >= modulesInfo.length) {
          Logger.severe("Reload cycle failed, some modules will not be working.")
          Logger.info(`Known modules: ${StringSetToSting(this.modules)}, Loaded modules: ${StringIteratorToSting(this.enabledModules.keys())}`)
          //reload command manager cache
          Logger.debug("Reloading command manager cache")
          await this.interactionManager.refreshCommandCache(clearOldCommands)

          //terminate process
          throw new Error("Unable to load all modules, dependencies are not met")
        }
      }
    }

    //reload command manager cache
    Logger.debug("Reloading command manager cache")
    await this.interactionManager.refreshCommandCache(clearOldCommands)

    Logger.info("Register listener")
    this.client.on("interactionCreate", this.interactionManager.onInteraction)

    Logger.info("Reload completed".green)
  }

  /**
   * Gets all the enabled modules
   * @returns Enabled modules
   */
  public getEnabledModules(): Map<string, moduleData[]> {
    return this.enabledModules
  }

  /**
   * Gets all the enabled modules
   * @returns Enabled modules
   */
  public async getDisabledModules(): Promise<Map<string, moduleData[]>> {
    const disabledModules = new Map<string, moduleData[]>()
    const it = this.modules.keys()
    let result = it.next()
    while (!result.done) {
      const module = result.value
      if (!this.enabledModules.has(module)) {
        const data = await this.fetchModule(module)
        disabledModules.set(module, data)
      }

      result = it.next()
    }

    return disabledModules
  }

  /**
   * Enables/ Loads a module
   * @param id The id of the module
   * @param modules The modules to load under the ID
   * @returns If the modules were loaded
  */
  //Loads a provided module
  public async load(id: string, modules: ModuleBase[]): Promise<boolean> {
    //check the id provided is valid for a folder
    if (!this.validateID(id)) {
      throw new Error(`Unable to load "${id}", invalid id. ID must only contain letters, numbers, and underscores`)
    }

    //check if the module is disabled
    if (this.config.data.disabled.includes(id)) {
      throw new Error(`Unable to load "${id}", module disabled`)
    }

    //check if the module is already loaded
    if (this.enabledModules.has(id)) {
      throw new Error(`Unable to load ${id}, module is already loaded`)
    }

    //Check modules are valid
    if (modules.length === 0) {
      throw new Error(`Unable to load ${id}, no modules provided`)
    }

    //get all parents
    const parents: Set<string> = new Set()
    modules.forEach(module => {
      if (module.depend_on) {
        module.depend_on.forEach(parent => {
          parents.add(parent)
        })
      }
    })

    //check if all the parents are loaded
    for (const parent of parents) {
      if (!this.enabledModules.has(parent)) {
        throw new Error(`Unable to load '${id}', parent module '${parent}' is not loaded`)
      }
    }

    //load the modules
    Logger.debug(`Loading module for ${id}`)
    const data: ModuleBase[] = []
    let error: unknown | undefined = undefined
    for (const module of modules) {
      try {
        Logger.debug(`Loading module ${module.name} from ${id}`)
        if (module.load) {
          await module.load(this.client)
        }
        data.push(module)
      } catch (err) {
        Logger.warn(`Failed to load part '${module.name}' from '${id}'`)
        error = err
        break
      }

      //register commands
      if (module.commands) {
        Logger.debug(`Registering commands for module ${module.name} from ${id}`)
        for (const command of module.commands) {
          this.interactionManager.addCommand(command, id)
        }
      }

      //register buttons
      if (module.buttons) {
        Logger.debug(`Registering buttons for module ${module.name} from ${id}`)
        for (const button of module.buttons) {
          this.interactionManager.addButtonInteraction(button[0], button[1], id)
        }
      }

      //register modals
      if (module.modals) {
        Logger.debug(`Registering modals for module ${module.name} from ${id}`)
        for (const modal of module.modals) {
          this.interactionManager.addModalInteraction(modal[0], modal[1], id)
        }
      }

      //register menus
      if (module.menus) {
        Logger.debug(`Registering select menus for module ${module.name} from ${id}`)
        for (const menu of module.menus) {
          this.interactionManager.addSelectMenuInteraction(menu[0], menu[1], id)
        }
      }

    }

    if (error != undefined) {
      await this.interactionManager.removeModuleData(id)
      throw new ModuleLoadFail(id, error)
    }

    this.modules.add(id)
    this.enabledModules.set(id, data)
    Logger.info(`Loaded module ${id}`)
    return true
  }


  //check if the provided object is a module
  private isModule(object: unknown): object is ModuleBase {
    return Object.prototype.hasOwnProperty.call(object, "name")
      && Object.prototype.hasOwnProperty.call(object, "version")
      && Object.prototype.hasOwnProperty.call(object, "description")
      && Object.prototype.hasOwnProperty.call(object, "author")
  }

  /**
   * Gets a module from its folder
   * @param id The id of the module
   * @returns An array of the modules found within the folder
  */
  //fetch function, will fetch a module(s) from its folder and return it, or null if no module is loaded
  private async fetchModule(id: string): Promise<ModuleBase[]> {
    const modules: ModuleBase[] = []

    //validate the file name as a valid module id
    if (!this.validateID(id)) {
      Logger.warn(`Invalid module id "${id}", ID must only contain letters, numbers, and underscores`)
      return modules
    }

    //check if the folder exists
    if (existsSync(join(this.PATH, id))) {
      //check a module.js file exists
      if (existsSync(join(this.PATH, id, "module.js"))) {
        try {
          //load the module file
          const moduleFile = await import(join(this.PATH, id, "module.js"))
          Logger.debug(`Fetched module file for ${id}, loading module classes`)

          //load classes of module
          for (const className in moduleFile) {
            Logger.debug(`Fetching module ${className} from module ${id}`)
            let module: unknown
            try {
              module = new moduleFile[className]()
            } catch (err) {
              Logger.silly(`${className} from module ${id} could not be constructed: ${err}`)
              module = moduleFile[className]
            }

            //check if the class is a module
            if (this.isModule(module)) {
              //check the module is valid
              if (module.name !== "") {
                //add the module to the list
                modules.push(module)
              }
            } else {
              Logger.silly(`${className} from module ${id} is not a module class`)
            }
          }
        } catch (error) {
          Logger.warn(`Failed to fetch module ${id}: ${error}`)
        }
      } else {
        Logger.warn(`Module ${id} does not have a module.js file`)
      }
    } else {
      Logger.warn(`Module ${id} does not exist`)
    }

    return modules
  }

  /**
   * Unloads a module
   * @param id The id of the module
   * @returns If the module was unloaded
   */
  //disable a module from the enabled modules list based on its id
  private async unload(id: string, removeBotData = false): Promise<boolean> {
    if (this.enabledModules.has(id)) {
      Logger.debug(`Unloading module ${id}`)
      //get the modules
      const modules = this.enabledModules.get(id)

      //check it has modules
      if (modules === undefined) {
        Logger.warn(`Unable to unload ${id}, unable to fetch modules`)
        this.enabledModules.delete(id) //remove it anyway
        return false
      }
      if (modules.length === 0) {
        Logger.warn(`Unable to unload ${id}, no modules to unload`)
        this.enabledModules.delete(id) //remove it anyway
        return false
      }

      //unload the modules
      for (const module of modules) {
        if (module.unload) {
          Logger.debug(`Unloading module ${module.name} from ${id}`)
          module.unload(this.client)
        }
      }

      //remove any interactions related to a module id
      if (removeBotData) this.interactionManager.removeModuleData(id)

      //remove the module from the enabled modules list
      this.enabledModules.delete(id)
      Logger.info(`Unloaded module ${id}`)
      return true
    } else {
      Logger.warn(`Module ${id} is not loaded`)
      return false
    }
  }

  /**
   * Used to validate module ids, must match regex '^\w{3,}$'
   * @param id The id to validate
   * @param
   * @returns If the id is valid
   */
  private validateID(id: string): boolean {
    const regex = /^[a-z0-9_-]{3,}$/gm
    return regex.test(id)
  }

}


/**
 * Default module
 */
class DefaultModule implements ModuleBase {
  private moduleManager: ModuleManager

  constructor(moduleManager: ModuleManager) {
    this.moduleManager = moduleManager
  }


  public name = "Default Module"
  public version = "1.0.0"
  public description = "Default module loaded by the bot, CAN NOT be disabled"
  public author = "kruthers"
  public commands: BotCommand[] = [
    {
      name: "reload",
      cmd_data: {
        name: "reload",
        description: "Reload the bot's modules",
      },
      function: (interaction) => {
        const reloaded: APIEmbed = {
          title: "Reloaded successfully!",
          color: global.colours.success,
        }

        interaction.reply({ embeds: [
          {
            title: "Reloading...",
            color: global.colours.standby,
          },
        ], fetchReply: true }).then((msg) => {
          this.moduleManager.reload().then(() => {
            if (msg instanceof Message) {
              msg.edit({ embeds: [ reloaded ] })
            } else {
              interaction.channel?.send({ embeds: [ reloaded ] })
            }
          })
        })
      },
    },
    {
      name: "modules",
      cmd_data: {
        name: "modules",
        description: "Manage and list current modules",
        type: ApplicationCommandType.ChatInput,
        options: [
          {
            name: "list",
            type: ApplicationCommandOptionType.Subcommand,
            description: "List all modules",
          },
          {
            name: "enable",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Enable a module",
            options: [
              {
                name: "module",
                type: ApplicationCommandOptionType.String,
                description: "Module to enable",
                required: true,
              },
            ],
          },
          {
            name: "disable",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Disable a module",
            options: [
              {
                name: "module",
                type: ApplicationCommandOptionType.String,
                description: "Module to disable",
                required: true,
              },
            ],
          },
        ],
      },
      function: (interaction) => {
        function getModuleFields(id: string, modules: moduleData[]): EmbedField[] {
          const fields: EmbedField[] = []
          for (const module of modules) {
            if (Array.isArray(module.author)) {
              fields.push({ name: `${module.name} (*${id}*) v${module.version}`, value: `${module.description}\n*By: ${module.author.join(", ")}*`, inline: false })
            } else {
              fields.push({ name: `${module.name} (*${id}*) v${module.version}`, value: `${module.description}\n*By: ${module.author}*`, inline: false })
            }
          }

          return fields
        }

        const subCommand = interaction.options.getSubcommand()
        switch (subCommand) {
          case "list": {
            const enabled = new EmbedBuilder({
              title: "Enabled Modules",
              description: "Here's the list of currently enabled modules:",
              color: global.colors.success,
            })

            for (const [ id, modules ] of this.moduleManager.getEnabledModules()) {
              enabled.addFields(getModuleFields(id, modules))
            }

            this.moduleManager.getDisabledModules().then(disabledModules => {
              let disabled = new EmbedBuilder({
                title: "Disabled Modules",
                description: "There is currently no disabled modules",
                color: global.colors.warn,
              })

              if (disabledModules.size > 0) {
                disabled = new EmbedBuilder({
                  title: "Disabled Modules",
                  description: "Here's the list of currently disabled modules:",
                  color: global.colors.error,
                })

                const it = disabledModules.keys()
                let result = it.next()
                while (!result.done) {
                  const id = result.value
                  const modules = disabledModules.get(id) || []

                  disabled.addFields(getModuleFields(id, modules))

                  result = it.next()
                }
              }

              interaction.reply({ embeds: [ enabled, disabled ] })
            })

            break
          }
          case "enable": {
            Logger.debug(`User ${interaction.user.username} is enabling module ${interaction.options.getString("module")}`)
            const module = interaction.options.getString("module")
            if (module) {
              interaction.reply({
                embeds: [
                  new EmbedBuilder({
                    title: `Attempting to enable module *'${module}'*`,
                    color: global.colors.standby,
                  }),
                ],
                fetchReply: true,
              }).then((message) => {
                this.moduleManager.enable(module).then(() => {
                  const embed = new EmbedBuilder({
                    title: `Module *'${module}'* has been enabled`,
                    color: global.colors.success,
                  })

                  if (message instanceof Message) {
                    message.edit({ embeds:[ embed ] })
                  } else {
                    interaction.channel?.send({ embeds: [ embed ] })
                  }
                }).catch((error) => {
                  let msg = `${codeBlock(error.message)}`
                  if (!(error instanceof ModuleLoadFail)) {
                    msg = msg + `\n${codeBlock(error.stack)}`
                  }

                  const embed = new EmbedBuilder({
                    title: `Failed to enable module *'${module}'*`,
                    description: msg,
                    color: global.colors.error,
                  })

                  if (message instanceof Message) {
                    message.edit({ embeds: [ embed ] })
                  } else {
                    interaction.channel?.send({ embeds: [ embed ] })
                  }
                })
              })
            } else {
              throw new Error("No module specified")
            }

            break
          }
          case "disable": {
            Logger.debug(`User ${interaction.user.username} is disabling module ${interaction.options.getString("module")}`)
            const module = interaction.options.getString("module")
            if (module) {
              interaction.reply({
                embeds: [
                  new EmbedBuilder({
                    title: `Attempting to disable module *'${module}'*`,
                    color: global.colors.standby,
                  }),
                ],
                fetchReply: true,
              }).then((message) => {
                this.moduleManager.disable(module).then(() => {
                  const embed = new EmbedBuilder({
                    title: `Module '${module}' has been disabled`,
                    color: global.colors.success,
                  })

                  if (message instanceof Message) {
                    message.edit({ embeds: [ embed ] })
                  } else {
                    interaction.channel?.send({ embeds: [ embed ] })
                  }
                }).catch((error) => {
                  let msg = `${codeBlock(error.message)}`
                  if (!(error instanceof ModuleLoadFail)) {
                    msg = msg + `\n${codeBlock(error.stack)}`
                  }

                  const embed = new EmbedBuilder({
                    title: `Failed to disable module *'${module}'*`,
                    description: msg,
                    color: global.colors.error,
                  })

                  if (message instanceof Message) {
                    message.edit({ embeds: [ embed ] })
                  } else {
                    interaction.channel?.send({ embeds: [ embed ] })
                  }
                })
              })
            } else {
              throw new Error("No module specified")
            }

            break
          }
        }
      },
    },
  ]

}


/**
 * Private data only classes, are used to store data in cache and unloading
 */
type moduleInfo = {
  id: string,
  modules: ModuleBase[],
  parents: Set<string>
}

type moduleData = {
  name: string,
  description: string,
  depends_on?: string[],
  version: string,
  author: string | string[],
  unload?: (client: Client) => void;
}

