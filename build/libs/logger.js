"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startLogger = exports.Logger = exports.getDateFormatted = void 0;
const colors_1 = require("colors");
const discord_js_1 = require("discord.js");
const path_1 = require("path");
const winston_1 = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
function getDateFormatted() {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = ("00" + date.getMonth()).slice(-2);
    const day = ("00" + date.getDate()).slice(-2);
    const hour = ("00" + date.getHours()).slice(-2);
    const minute = ("00" + date.getMinutes()).slice(-2);
    const second = ("00" + date.getSeconds()).slice(-2);
    const milliseconds = ("00" + date.getMilliseconds()).slice(-2);
    return `${year}-${month}-${day}_${hour}:${minute}:${second}.${milliseconds}`;
}
exports.getDateFormatted = getDateFormatted;
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    silly: 4,
};
const display = winston_1.format.printf(({ level, message, timestamp }) => {
    const colorStamp = (0, colors_1.cyan)("[" + timestamp + "]");
    switch (level) {
        case "error": return `${colorStamp} [${"FATAL".red}] ${message.yellow}`;
        case "warn": return `${colorStamp} [${"WARNING".yellow}] ${message}`;
        case "info": return `${colorStamp} [${"INFO".green}] ${message}`;
        case "debug": return `${colorStamp} [${"DEBUG".gray}] ${message}`;
        case "silly": return `${colorStamp} [${"SILLY".gray.italic}] ${message}`;
    }
    return `${colorStamp} [${level.toUpperCase()}] ${message}`;
});
exports.Logger = {
    info: (msg) => {
        log.log("info", msg);
    },
    warn: (msg) => {
        log.log("warn", msg);
    },
    severe: (msg) => {
        log.log("error", msg);
    },
    debug: (msg) => {
        log.log("debug", msg);
    },
    silly: (msg) => {
        log.log("silly", msg);
    },
    message: (msg) => {
        //check if the message was sent in a guild
        if (global.log.messages) {
            if (msg.guild instanceof discord_js_1.Guild && msg.channel instanceof discord_js_1.BaseGuildTextChannel) {
                msgLog.log("message", `${(0, colors_1.grey)(`[${msg.guild.name}/#${msg.channel.name}]`)} ${msg.author.username} | ${msg.content}`);
            }
            else {
                msgLog.log("message", `${(0, colors_1.grey)(`[@${msg.author.username}]`)} ${msg.author.username} | ${msg.content}`);
            }
        }
    },
    transports: {
        console: new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.timestamp({ format: "YY-MM-DD HH:mm:ss.SSS" }), display),
            handleExceptions: true,
            handleRejections: true,
        }),
        file: new DailyRotateFile({
            level: "debug",
            filename: "%DATE%.log",
            auditFile: (0, path_1.join)(__dirname, "../logs/.config.json"),
            dirname: (0, path_1.join)(__dirname, "../logs"),
            maxFiles: 20,
            zippedArchive: true,
            format: winston_1.format.combine(winston_1.format.timestamp({ format: "HH:mm:ss.SSS" }), display, winston_1.format.uncolorize()),
            handleExceptions: false,
            handleRejections: false,
        }),
    },
};
let log;
function startLogger(path) {
    log = (0, winston_1.createLogger)({
        levels: levels,
        level: "info",
        transports: [
            exports.Logger.transports.console,
            exports.Logger.transports.file,
        ],
        exceptionHandlers: [
            new winston_1.transports.File({
                filename: "exceptions.log",
                dirname: path,
                format: winston_1.format.combine(winston_1.format.timestamp({ format: "HH:mm:ss.SSS" }), display, winston_1.format.uncolorize()),
            }),
        ],
        rejectionHandlers: [
            new winston_1.transports.File({
                filename: "rejections.log",
                dirname: path,
                format: winston_1.format.combine(winston_1.format.timestamp({ format: "YY-MM-DD HH:mm:ss.SSS" }), display, winston_1.format.uncolorize()),
            }),
        ],
        handleExceptions: true,
        exitOnError: false,
    });
}
exports.startLogger = startLogger;
//specific logger to handle message logging
const msgLog = (0, winston_1.createLogger)({
    levels: {
        message: 0,
    },
    transports: [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.timestamp({ format: "YY-MM-DD HH:mm:ss.SSS" }), winston_1.format.printf(({ level, message, timestamp }) => {
                const colorStamp = (0, colors_1.cyan)("[" + timestamp + "]");
                return `${colorStamp} [${level.toUpperCase().magenta}] ${message}`;
            })),
            level: "message",
            handleExceptions: false,
            handleRejections: false,
        }),
    ],
});
