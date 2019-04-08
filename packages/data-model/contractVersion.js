const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

let ContractVersionSchema = new Mongoose.Schema({
  contract: String,   // e.g. "Project"
  version: Number,    // increasing integers, starting from 1.
  abi: String,
});

module.exports = ModelUtils.exportModel('ContractVersion', ContractVersionSchema);
