import { BotCommand } from "./Module"

type commandData = BotCommand & {
  id: string;
  module: string;
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
