var Mongoose = require('mongoose');

var MailSchema = new Mongoose.Schema({
  from: String,
  to: String,
  subject: String,
  html: String,
  type: String,
  status: {type: String, default: "NEW", enum: ["SENT", "NEW", "FAIL"]},
  sendDate: Date,
  createdAt: {type: Date, default: Date.now}
});

module.exports = Mongoose.model('Mail', MailSchema);
