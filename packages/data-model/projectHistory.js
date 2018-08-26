const Mongoose = require('mongoose');

let ProjectHistorySchema = new Mongoose.Schema({
  project: Mongoose.Schema.Types.Mixed,
  outcomes: [Mongoose.Schema.Types.Mixed],
  changedBy: {
    type: Mongoose.Schema.ObjectId,
    ref: 'User'
  },
  changedDate: {type: Date, default: Date.now}
});

module.exports = Mongoose.model('ProjectHistory', ProjectHistorySchema);