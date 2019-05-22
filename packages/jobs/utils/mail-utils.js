const Config = require('../config');
const MailProxy = require('../gateways/mailProxy');
const ModelUtils = require('../utils/model-utils');
const MailModel = ModelUtils.loadModel('mail');
const Moment = require('moment');
const logger = require('./logger')('utils/mail-utils');

function Mail() {
}

var formatMoney = function (amount) {
  return '£' + Number(amount / 100).toFixed(2);
};

Mail.sendImpactConfirmation = function (user, project, impact) {
  impact.money = formatMoney(impact.amount);
  let mailToSend = {
    template: 'impactConfirmation.mustache',
    subject: 'Donation paid',
    from: Config.awsEmailSenderAddress,
    to: user.email,
    data: {
      user: user,
      project: project,
      impact: impact,
      title: 'Donation paid',
      subtitle: 'Success!'
    },
    type: 'ImpactConfirmation'
  };
  return MailProxy.requestSending(mailToSend);
};

Mail.sendErrorNotification = function (type, context, err) {
  let mailToSend = {
    template: 'errorNotification.mustache',
    subject: 'Hey developer! Error occured :(',
    from: Config.awsEmailSenderAddress,
    to: Config.developerEmails,
    data: {
      err: JSON.stringify(err),
      mode: Config.mode || 'Local',
      context: JSON.stringify(context),
      time: new Date().toISOString(),
      type: type
    },
    type: 'ErrorNotification'
  };
  return MailModel.find({
    status: 'MAIL_SENDING_COMPLETED',
    sendDate: {
      $gt: (new Moment()).subtract(Config.repeatedErrorTimeout, 's').toDate()
    }
  }).then(function (mails) {
    if (mails && mails.length > 0) {
      for (let mail of mails) {
        const isRepeated = mail.subject == mailToSend.subject && mail.html.includes(err);
        if (isRepeated) {
          logger.info(`Mail is repeated for ${mail._id}. Skipping...`);
          return Promise.resolve();
        }
      }
    }
    return MailProxy.requestSending(mailToSend);
  });
};

Mail.sendStalledDonationsNotification = function (donationStatuses, donations) {
  let mailToSend = {
    template: 'stalledDonationsNotification.mustache',
    subject: 'Hey developer! Check stalled donation statuses!',
    from: Config.awsEmailSenderAddress,
    to: Config.developerEmails,
    data: {
      report: JSON.stringify(donationStatuses),
      donations: donations,
      mode: Config.mode || 'Local',
    },
    type: 'StalledDonationsNotification'
  };
  return MailProxy.requestSending(mailToSend);
}

module.exports = Mail;
