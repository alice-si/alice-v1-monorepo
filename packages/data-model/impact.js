const Mongoose = require('mongoose');

let ImpactSchema = new Mongoose.Schema({
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
  _validationId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Validation'
  },
  amount: Number,
  confirmationEmail: String
});

module.exports = Mongoose.model('Impact', ImpactSchema);