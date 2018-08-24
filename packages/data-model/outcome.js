var Mongoose = require('mongoose');

var OutcomeSchema = new Mongoose.Schema({
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
    ref: 'Campaign'
  }

});

module.exports = Mongoose.model('Outcome', OutcomeSchema);