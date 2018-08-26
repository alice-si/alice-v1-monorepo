const Mongoose = require('mongoose');

const mailStatuses = ["SENT", "NEW", "FAIL"];

let MailSchema = new Mongoose.Schema({
  from: String,
  to: String,
  subject: String,
  html: String,
  type: String,
  status: {type: String, default: "NEW", enum: mailStatuses},
  sendDate: Date,
  createdAt: {type: Date, default: Date.now}
});

module.exports = Mongoose.model('Mail', MailSchema);
