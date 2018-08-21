const winston = require('winston'),
      _ = require('lodash')

/** @module logger */

var transports = {
   file: new winston.transports.File({ filename: 'leths.log', level: 'info' }),
   console: new winston.transports.Console({ format: winston.format.simple(), level: 'debug', silent: true})
}

let loggers = {}

function getLogger(label) {
  return  winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp(),
      winston.format.label({ label: label }),
      winston.format.splat(),
      winston.format.printf(info => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`),
      winston.format.colorize({ all: true })
   ),
   transports: [
    transports.console,
    transports.file
  ]
 })
}

module.exports = {
  getLogger(label) {
    if(process.env.NODE_ENV === 'test') {
      return { debug() {}, info() {}, warn() {}, error() {} }
    }
    //TODO Fix logger label
    label = ''
    if(!loggers[label]) loggers[label] = getLogger(label)
    return loggers[label]
  },
  setLevel(level) {
    transports.file.level = level
  },
  toConsole() {
    transports.console.silent = false
  }
}
