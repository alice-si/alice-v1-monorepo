const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

let OutcomeSchema = new Mongoose.Schema({
  title: String,
  description: String,
  reason: String,
  value: String,
  image: String,
  amount: Number,
  completion: Number,
  target: Number,
  hidden: Boolean,
  category: String,
  _parentId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Project'
  }
});

module.exports = ModelUtils.exportModel('Outcome', OutcomeSchema);