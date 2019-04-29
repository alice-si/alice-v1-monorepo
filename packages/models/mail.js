const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

const mailProcesses = ["MAIL_SENDING"];
const mailStatuses = ["CREATED"];

let MailSchema = new Mongoose.Schema({
  from: String,
  to: Mongoose.Schema.Types.Mixed,
  subject: String,
  html: String,
  type: String,
  status: {
    type: String,
    default: "CREATED",
    enum: ModelUtils.evaluateStatuses(mailProcesses, mailStatuses)
  },
  sendDate: Date,
  createdAt: {type: Date, default: Date.now}
});

module.exports = ModelUtils.exportModel('Mail', MailSchema);
