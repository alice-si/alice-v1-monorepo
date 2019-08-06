const ModelUtils = require('../utils/model-utils');
const MailProxy = require('../gateways/mailProxy');
const { ModelJob } = require('./job');

const Mail = ModelUtils.loadModel('mail');

class MailSendingJob extends ModelJob {
  constructor() {
    super('MAIL_SENDING', Mail, 'CREATED');
  }

  async run(mail) {
    await MailProxy.send(mail);
    mail.sendDate = new Date();
    await mail.save();
  }
}

module.exports = MailSendingJob;
