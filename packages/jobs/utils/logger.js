const config = require('../config');
const winston = require('winston');

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = function (module) {
  return logger.child({module});
};