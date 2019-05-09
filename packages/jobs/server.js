const config = require("./config");
const mongoose    = require('mongoose');
const runJobs = require('./utils/run-jobs');


const intervalSeconds = 10;

mongoose.Promise = require('bluebird');

mongoose.connect(config.db, {useNewUrlParser: true}).then(function() {
  console.log("DB connected");
}, function(err) {
  console.log("DB is not connected: " + err);
  throw err;
});

runJobs(intervalSeconds);
