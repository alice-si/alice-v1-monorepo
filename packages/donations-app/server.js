const fs = require('fs');
const https = require('https');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const morgan = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const cache = require('mongoose-cache');
const moment = require('moment');
const helmet = require('helmet');
const expressSanitized = require('express-sanitize-escape');
const configValidator = require('./tools/config-validator');
const cors = require('cors');

var port = process.env.PORT || 8080; // set our port
var config = require('./config');

configValidator.validate(config);

if (mongoose.connection.readyState == 1) {
  console.log('Mongoose is already connected. Skipping new connection...');
} else {
  console.log('Connecting to mongoose...');
  mongoose.connect(config.db, {useNewUrlParser: true});
}

var Promise = require('bluebird');
Promise.config({
  cancellation: true
});
mongoose.Promise = Promise;

cache.install(mongoose, {max:100, maxAge:30000});

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

//Logging
console.logCopy = console.log.bind(console);

console.log = function(data)
{
  var currentDate = '[' + moment().format('DD/MMM/YYYY:HH:mm:ss') + '] ';
  this.logCopy(currentDate, data);
};

// to avoid web vulnerabilities
app.use(helmet());

app.use(bodyParser.json()); // parse application/json
// get all data/stuff of the body (POST) parameters
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded

// TODO it should be enabled again after moving to monorepo
// We also should add htmlDecodeing for project outcomes titles (fusion-housing project)
// app.use(expressSanitized.middleware({encoder: false})); // sanitize all requests to avoid xss attack <- it sanitizes req.body and req.query
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT

app.use(cors());

//log to console
morgan.token('date', function() {
  return '[' + moment().format('DD/MMM/YYYY:HH:mm:ss') + '] ';
});
app.use(morgan(':date :method :url :status :response-time ms - :res[content-length]'));
app.use(passport.initialize());

require('./devServer/passport')(passport);

// routes ==================================================
require('./devServer/routes')(app); // configure our routes

app.use(function(error, req, res, next) {
  // Gets called because of `wrapAsync()`
  res.status(500).json({ message: error.message });
});

//STATIC FILES

//resources
if (!config.isProductionMode()) {
  const staticdir = process.env.DIST_PATH || 'dist.local';
  app.use(express.static(__dirname + '/' + staticdir)); // set the static files location /public/img will be /img for users
  // html5
  app.get('/*', function(req, res) {
    res.sendFile(__dirname + '/' + staticdir + '/index.html');
  });
}

// start app ===============================================
if (config.isProductionMode()) {
  var options = {
    key  : fs.readFileSync(config.pathToKeys + 'private.key'),
    cert : fs.readFileSync(config.pathToKeys + 'certificate.crt'),
    ca   : fs.readFileSync(config.pathToKeys + 'ca_bundle.crt')
  };
  port = 4443;
  https.createServer(options, app).listen(port, function () {
    console.log('Starting PROD server ' + port); // shoutout to the user
  });
} else {
  app.listen(port); // startup our app at http://localhost:8080
  console.log('Starting server ' + port); // shoutout to the user
}

exports = module.exports = app; // expose app
