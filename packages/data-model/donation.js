var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var DonationSchema = new Schema({
  _userId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'User'
  },
  _campaignId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Campaign'
  },
  amount: Number,
  createdAt: Date,
  loadingTx: String,
  loadingTime: Date,
  donatingTx: String,
  donatingTime: Date,
  status: {
    type: String,
    enum: [
      "PENDING",
      "FAILED",
      "ERROR",
      "WIRED",
      "DONATED",
      "LOADED",
      "COLLECTED",
      "3DS",
      "CLEANED",
      "LOST",
      "MINTING",
      "MINTED",
      "MINTING_IN_PROGRESS",
      "COLLECTION_IN_PROGRESS",
      "LOADING",
      "DONATING"
    ]},
  transactionId: String
});

module.exports = Mongoose.model('Donation', DonationSchema);