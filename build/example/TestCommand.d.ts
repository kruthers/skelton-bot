import { ApplicationCommandData, ChatInputCommandInteraction, CacheType } from "discord.js";
import { BotCommand, Client } from "../main";
export default class TestCommand implements BotCommand {
    private readonly bot;
    constructor(bot: Client);
    cmd_data: ApplicationCommandData;
    callback(interaction: ChatInputCommandInteraction<CacheType>): Promise<void>;
    name: string;
}
