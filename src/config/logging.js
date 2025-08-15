// logging.config.js
require('dotenv').config();
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const SlackHook = require('winston-slack-webhook-transport');
const Papertrail = require('winston-papertrail').Papertrail;

const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

const loggers = {
  single: createLogger({
    level: LOG_LEVEL,
    format: format.combine(
      format.timestamp(),
      format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [
      new transports.File({ filename: 'storage/logs/app.log' }),
    ],
  }),

  daily: createLogger({
    level: LOG_LEVEL,
    format: format.combine(format.timestamp(), format.json()),
    transports: [
      new transports.DailyRotateFile({
        filename: 'storage/logs/app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
      }),
    ],
  }),

  slack: createLogger({
    level: process.env.LOG_LEVEL || 'critical',
    transports: [
      new SlackHook({
        webhookUrl: process.env.LOG_SLACK_WEBHOOK_URL,
        username: 'Node Log',
        iconEmoji: ':boom:',
        level: 'error',
      }),
    ],
  }),

  papertrail: createLogger({
    level: LOG_LEVEL,
    transports: [
      new Papertrail({
        host: process.env.PAPERTRAIL_URL,
        port: process.env.PAPERTRAIL_PORT,
        program: 'node-app',
        colorize: true,
      }),
    ],
  }),

  console: createLogger({
    level: LOG_LEVEL,
    format: format.combine(format.colorize(), format.simple()),
    transports: [new transports.Console()],
  }),
};

module.exports = {
  default: process.env.LOG_CHANNEL || 'single',
  loggers,
};
