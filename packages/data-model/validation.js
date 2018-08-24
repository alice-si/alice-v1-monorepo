var Mongoose = require('mongoose');

var ValidationSchema = new Mongoose.Schema({
  _campaignId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Campaign'
  },
  _outcomeId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Outcome'
  },
  _userId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'User'
  },
  amount: Number,

  crypto: String,
  createdAt: Date,
  loadTx: String,
  loadTime: Date,
  executionTx: String,
  executionTime: Date,
  status: String
});

module.exports = Mongoose.model('Validation', ValidationSchema);