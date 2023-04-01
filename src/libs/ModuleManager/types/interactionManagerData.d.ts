import { BotCommand } from "./Module"

type commandData = {
  id: string;
  module: string;
  data: BotCommand
}

type genericData<T> = {
  id: string,
  module: string,
  callback(interaction: T): void,
}

type colours = {
  error: number;
  success: number;
  warn: number;
  standby: number;
  neutral: number;
}
