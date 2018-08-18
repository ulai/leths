const winston = require('winston')

/** @module logger */

module.exports = {
  getLogger(label) {
    return getLogger(label)
    if(!this.logger) this.logger = getLogger()
    return this.logger;
  },
};

function getLogger(label) {
  return  winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp(),
      winston.format.label({ label: label }),
      winston.format.splat(),
      winston.format.printf(info => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`)
   ),
   transports: [
     new winston.transports.File({
       filename: 'leths.log',
       level: 'info'
     }),
   ]
 });
}
