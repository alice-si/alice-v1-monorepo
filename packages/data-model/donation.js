const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

const processNames = ['MINTING', 'DEPOSITING', 'COLLECTING'];
const statuses = ['PENDING', 'DONATED'];

let Schema = Mongoose.Schema;

let donationSchemaObj = {
  _userId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'User'
  },
  _projectId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  amount: Number,
  createdAt: Date,

  status: {
    type: String,
    enum: ModelUtils.evaluateStatuses(processNames, statuses)
  },
  transactionId: String
};

ModelUtils.addDateFields(processNames, donationSchemaObj);
ModelUtils.addTxFields(processNames, donationSchemaObj);

let DonationSchema = new Schema(donationSchemaObj);

module.exports = ModelUtils.exportModel('Donation', DonationSchema);