const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

let DeployedContractSchema = new Mongoose.Schema({
  address: String,
  contract: String,   // e.g. "Project"
  version: Number,
  abi: String,
});

module.exports = ModelUtils.exportModel('DeployedContract', DeployedContractSchema);
