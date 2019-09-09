const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

let OutcomeSchema = new Mongoose.Schema({
  title: String,
  orderNumber: Number,
  description: String,
  reason: String,
  value: String,
  image: String,
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
