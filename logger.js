const winston = require('winston');

/** @module logger */

module.exports = {
  getLogger() {
    if(!this.logger) this.logger = getLogger();
    return this.logger;
  },
};

function getLogger() {
  return  winston.createLogger({
   format: winston.format.json(),
   transports: [
     new winston.transports.File({
       filename: 'leths.log',
       level: 'info'}),
   ]
 });
}
