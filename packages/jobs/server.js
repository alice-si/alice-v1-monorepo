const config = require('./config');
const mongoose = require('mongoose');
const runJobs = require('./utils/run-jobs');
const logger = require('./utils/logger')('server');


const intervalSeconds = 10;

mongoose.Promise = require('bluebird');

mongoose.connect(config.db, {useNewUrlParser: true}).then(function() {
  logger.info('DB connected');
}, function(err) {
  logger.error(err);
  throw err;
});

runJobs(intervalSeconds);
