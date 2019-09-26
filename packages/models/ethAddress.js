const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

let EthAddressSchema = new Mongoose.Schema({
  address: String,
  index: Number, // for addresses generated using mnemonic key
  privateKey: String, // for addresses generated using private key
});

module.exports = ModelUtils.exportModel('EthAddress', EthAddressSchema);
