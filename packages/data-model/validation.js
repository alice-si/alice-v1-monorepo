const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

const processNames = ['CLAIMING', 'VALIDATING', 'LINKING', 'IMPACT_FETCHING'];
const statuses = ['CREATED', 'APPROVED', 'LINKING_STEP_COMPLETED'];

let validationSchemaObject = {
  _projectId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  _outcomeId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Outcome'
  },
  // Formerly known as _userId.
  _validatorId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'User'
  },
  amount: Number,

  // Encrypted Ethereum passwords of claimer (beneficiary) and validator.
  // Removed from documents as soon as the transactions are complete.
  beneficiaryPass: String,
  validatorPass: String,

  createdAt: Date,
  linkingTransactions: [String],
  status: {
    type: String,
    enum: ModelUtils.evaluateStatuses(processNames, statuses)
  }
};

ModelUtils.addDateFields(processNames, validationSchemaObject);
ModelUtils.addTxFields(processNames, validationSchemaObject);

const ValidationSchema = new Mongoose.Schema(validationSchemaObject);

module.exports = ModelUtils.exportModel('Validation', ValidationSchema);
