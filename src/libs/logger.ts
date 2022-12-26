import { cyan, grey } from "colors"
import { BaseGuildTextChannel, Guild, Message } from "discord.js"
import { join } from "path"
import { createLogger, format, Logger as WLogger, transports } from "winston"
import DailyRotateFile = require("winston-daily-rotate-file");

export function getDateFormatted(): string {
  const date = new Date()

  const year: string = date.getFullYear().toString()
  const month: string = ("00" + date.getMonth()).slice(-2)
  const day: string = ("00" + date.getDate()).slice(-2)

  const hour: string = ("00" + date.getHours()).slice(-2)
  const minute: string = ("00" + date.getMinutes()).slice(-2)
  const second: string = ("00" + date.getSeconds()).slice(-2)
  const milliseconds: string = ("00" + date.getMilliseconds()).slice(-2)

  return `${year}-${month}-${day}_${hour}:${minute}:${second}.${milliseconds}`
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  silly: 4,
}

const display = format.printf(({ level, message, timestamp }) => {
  const colorStamp: string = cyan("[" + timestamp + "]")

  switch (level) {
    case "error": return `${colorStamp} [${"FATAL".red}] ${message.yellow}`
    case "warn": return `${colorStamp} [${"WARNING".yellow}] ${message}`
    case "info": return `${colorStamp} [${"INFO".green}] ${message}`
    case "debug": return `${colorStamp} [${"DEBUG".gray}] ${message}`
    case "silly": return `${colorStamp} [${"SILLY".gray.italic}] ${message}`
  }

  return `${colorStamp} [${level.toUpperCase()}] ${message}`
})

export const Logger = {
  info: (msg: string) => {
    log.log("info", msg)
  },
  warn: (msg: string) => {
    log.log("warn", msg)
  },
  severe: (msg: string) => {
    log.log("error", msg)
  },
  debug: (msg: string) => {
    log.log("debug", msg)
  },
  silly: (msg: string) => {
    log.log("silly", msg)
  },
  message: (msg: Message) => {
    //check if the message was sent in a guild
    if (global.log.messages) {
      if (msg.guild instanceof Guild && msg.channel instanceof BaseGuildTextChannel) {
        msgLog.log("message", `${grey(`[${msg.guild.name}/#${msg.channel.name}]`)} ${msg.author.username} | ${msg.content}`)
      } else {
        msgLog.log("message", `${grey(`[@${msg.author.username}]`)} ${msg.author.username} | ${msg.content}`)
      }
    }
  },
  transports: {
    console: new transports.Console({
      format: format.combine(
        format.timestamp({ format: "YY-MM-DD HH:mm:ss.SSS" }),
        display,
      ),
      handleExceptions: true,
      handleRejections: true,
    }),
    file: new DailyRotateFile({
      level: "debug",
      filename: "%DATE%.log",
      auditFile: join(__dirname, "../logs/.config.json"),
      dirname:  join(__dirname, "../logs"),
      maxFiles: 20,
      zippedArchive: true,
      format: format.combine(
        format.timestamp({ format: "HH:mm:ss.SSS" }),
        display,
        format.uncolorize(),
      ),
      handleExceptions: false,
      handleRejections: false,
    }),
  },
}


let log: WLogger

export function startLogger(path: string) {
  log = createLogger({
    levels: levels,
    level: "info",
    transports: [
      Logger.transports.console,
      Logger.transports.file,
    ],
    exceptionHandlers: [
      new transports.File({
        filename: "exceptions.log",
        dirname: path,
        format: format.combine(
          format.timestamp({ format: "HH:mm:ss.SSS" }),
          display,
          format.uncolorize(),
        ),
      }),
    ],
    rejectionHandlers: [
      new transports.File({
        filename: "rejections.log",
        dirname: path,
        format: format.combine(
          format.timestamp({ format: "YY-MM-DD HH:mm:ss.SSS" }),
          display,
          format.uncolorize(),
        ),
      }),
    ],
    handleExceptions: true,
    exitOnError: false,
  })
}

//specific logger to handle message logging
const msgLog = createLogger({
  levels: {
    message: 0,
  },
  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp({ format: "YY-MM-DD HH:mm:ss.SSS" }),
        format.printf(({ level, message, timestamp }) => {
          const colorStamp = cyan("[" + timestamp + "]")
          return `${colorStamp} [${level.toUpperCase().magenta}] ${message}`
        }),
      ),
      level: "message",
      handleExceptions: false,
      handleRejections: false,
    }),
  ],
})



