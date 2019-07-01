const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

let OutcomeSchema = new Mongoose.Schema({
  title: String,
  description: String,
  reason: String,
  value: String,
  image: String,
  // amount = price of validation
  // it is basically the same as: costPerUnit
  // so should we remove costPerUnit? 
  amount: Number,
  unit: String,
  costPerUnit: Number,
  quantityOfUnits: Number,
  completion: Number,
  target: Number,
  hidden: Boolean,
  category: String,
  color: String,
  _projectId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Project'
  }
});

module.exports = ModelUtils.exportModel('Outcome', OutcomeSchema);
