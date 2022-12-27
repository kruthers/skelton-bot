import { Message } from "discord.js";
import { transports } from "winston";
import DailyRotateFile = require("winston-daily-rotate-file");
export declare function getDateFormatted(): string;
export declare const Logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    severe: (msg: string) => void;
    debug: (msg: string) => void;
    silly: (msg: string) => void;
    message: (msg: Message) => void;
    transports: {
        console: transports.ConsoleTransportInstance;
        file: DailyRotateFile;
    };
};
export declare function startLogger(path: string): void;
