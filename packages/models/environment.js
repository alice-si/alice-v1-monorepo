const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

const Schema = Mongoose.Schema;

// This entity represents testing environments deployed on exp cluster
const EnvironmentSchema = new Schema({
  url: String
});

module.exports = ModelUtils.exportModel('Environment', EnvironmentSchema);
