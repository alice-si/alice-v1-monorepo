const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

let EthAddressSchema = new Mongoose.Schema({
  address: String,
  index: String,
});

module.exports = ModelUtils.exportModel('EthAddress', EthAddressSchema);
