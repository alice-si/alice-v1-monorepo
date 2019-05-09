const JobUtils = require('../utils/job-utils');
const ModelUtils = require('../utils/model-utils');
const MailProxy = require('../gateways/mailProxy');
const Mail = ModelUtils.loadModel('mail');

function mainAction(jobContext) {
  let mail = jobContext.model;
  return MailProxy.send(mail).then(function () {
    mail.sendDate = new Date();
    return mail.save().then(jobContext.completedBehaviour);
  }, function (err) {
    return jobContext.errorBehaviour(err);
  });
}

module.exports = JobUtils.createJob({
  processName: 'MAIL_SENDING',
  createChecker: false,
  modelGetter: (() => Mail.findOneAndUpdate({status: "CREATED"}, {status: 'MAIL_SENDING_STARTED'})),
  action: mainAction
});
