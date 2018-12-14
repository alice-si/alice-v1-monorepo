const Mongoose = require("mongoose");
const ModelUtils = require("./model-utils");

const processNames = ["MINTING", "DEPOSITING", "COLLECTING", "DAI_COLLECTING"];
const statuses = ["CREATED", "DONATED", "FAILED", "3DS", "BIG_TRANSFER_CREATED", "BANK_TRANSFER_REQUESTED"];

let Schema = Mongoose.Schema;

let donationSchemaObj = {
  _userId: {
    type: Mongoose.Schema.ObjectId,
    ref: "User"
  },
  _projectId: {
    type: Mongoose.Schema.ObjectId,
    ref: "Project"
  },
  amount: Number,
  createdAt: Date,

  type: {
    type: String,
    enum: ["BANK_TRANSFER", "CARD", "DAI"],
    default: "CARD"
  },

  status: {
    type: String,
    enum: ModelUtils.evaluateStatuses(processNames, statuses)
  },
  transactionId: String,

  bankTransferCheckingTime: Date,
  bankTransferData: Schema.Types.Mixed,

  daiTx: String,
  daiAddress: String
};

ModelUtils.addDateFields(processNames, donationSchemaObj);
ModelUtils.addTxFields(processNames, donationSchemaObj);

let DonationSchema = new Schema(donationSchemaObj);

module.exports = ModelUtils.exportModel("Donation", DonationSchema);
