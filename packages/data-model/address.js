const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const ModelUtils = require('./model-utils');

let AddressSchema = new Schema({
  _user: {
    type: Mongoose.Schema.ObjectId,
    ref: 'User'
  },
  key: {
    type: String,
    unique: true,
    required: true
  },
  balance: {
    type: Number,
    required: true
  },
  _transaction: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Transaction'
  },
});

module.exports = ModelUtils.exportModel('Address', AddressSchema);