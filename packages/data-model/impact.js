const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

let ImpactSchema = new Mongoose.Schema({
  _projectId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  _outcomeId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Outcome'
  },
  _userId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'User'
  },
  _validationId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Validation'
  },
  amount: Number,
  confirmationEmail: String
});

module.exports = ModelUtils.exportModel('Impact', ImpactSchema);