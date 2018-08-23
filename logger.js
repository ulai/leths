const winston = require('winston'),
      _ = require('lodash'),
      { LEVEL, SPLAT } = require('triple-beam')

/** @module logger */

var transports = {
   file: new winston.transports.File({ filename: 'leths.log', level: 'info' }),
   console: new winston.transports.Console({ format: winston.format.simple(), level: 'debug', silent: true})
}

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp(),
    winston.format.splat(),
    winston.format.printf(info => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`),
 ),
 transports: [
  transports.console,
  transports.file
 ]
})

class Logger {
  constructor(label) {
    Object.keys(logger.levels).forEach(level => {
      this[level] = (...args) => {
          // Optimize the hot-path which is the single object.
          if (args.length === 1) {
            const [msg] = args
            const info = msg && msg.message && msg || { message: msg }
            info.level = level
            info.label = label
            logger.write(info)
            return this
          }
          const [msg] = args
          logger.write(Object.assign({}, {
            [LEVEL]: level,
            [SPLAT]: args.splice(1),
            level,
            label,
            message: msg
          }))
          return this
      }
    })
  }
}

module.exports = {
  getLogger(label) {
    return new Logger(label)
  },
  setLevel(level) {
    transports.file.level = level
  },
  toConsole() {
    transports.console.silent = false
  }
}
