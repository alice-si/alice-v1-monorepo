const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

let AccessRequestSchema = new Mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  accessCode: String,
  _userId: {
    type: Mongoose.Schema.ObjectId,
    ref: "User"
  },
  scope: String, // Level of access
});

module.exports = ModelUtils.exportModel('AccessRequest', AccessRequestSchema);
