var MailSender = require('../mail/mail-sender.js');
var Mango = require('./mango');

function Mail() {
}

var formatMoney = function (amount) {
  return '£' + Number(amount / 100).toFixed(2);
};

Mail.sendAccountConfirmation = function (user) {
  return MailSender.requestSending({
    template: 'accountConfirmation.mustache',
    subject: 'Welcome to Alice',
    to: user.email,
    data: {
      user: user,
      title: 'Welcome to Alice',
      subtitle: 'Welcome!'
    },
    type: "AccountConfirmation"
  });
};

Mail.sendDonationError = function (user, project, err, is3DS) {
  console.log("Sending donation error to: " + user.email);
  return MailSender.requestSending({
    template: 'donationError.mustache',
    subject: 'Donation failed',
    to: user.email,
    data: {
      user: user,
      project: project,
      err: err,
      is3DS: is3DS,
      securityTreshold: formatMoney(Mango.securityTreshold),
      title: 'Donation failed',
      subtitle: 'Donation failed'
    },
    type: "DonationError"
  });
};

Mail.sendDonationConfirmation = function (user, project, donation) {
  donation.money = formatMoney(donation.amount);
  console.log("Sending donation confirmation: " + donation._id + " to: " + user.email);
  return MailSender.requestSending({
    template: 'donationConfirmation.mustache',
    subject: 'Donation received',
    to: user.email,
    data: {
      user: user,
      project: project,
      donation: donation,
      title: 'Donation received',
      subtitle: 'Thank you!'
    },
    type: "DonationConfirmationDonationReceived"
  });
};

Mail.sendAliceInvitation = function (user) {
  console.log(`Sending alice email invitation to ${user.email}`);
  return MailSender.requestSending({
    template: 'aliceInvitation.mustache',
    subject: 'Sign up to Alice',
    to: user.email,
    data: {
      user: user,
      title: 'Sign up to Alice',
      subtitle: 'Sign up!'
    },
    type: "AliceInvitation"
  });
};

Mail.sendBankTransferRequestConfirmation = function (user, project, donation) {
  donation.money = formatMoney(donation.amount);
  console.log("Sending bank transfer request confirmation: " + donation._id + " to: " + user.email);
  donation = prepareDonationBankInfo(donation);
  return MailSender.requestSending({
    template: 'bankTransferRequestConfirmation.mustache',
    subject: 'Donation with bank transfer requested',
    to: user.email,
    data: {
      user: user,
      project: project,
      donation: donation,
      title: 'Finish your donation',
      subtitle: 'Please finish your donation!'
    },
    type: "BankTransferRequestConfirmation"
  });
};

Mail.sendDaiDonationConfirmation = function (user, donation) {
  console.log('Sending dai donation confirmation: ' + donation.donationTx);
  return MailSender.requestSending({
    template: 'daiDonationConfirmation.mustache',
    subject: 'Thanks for donating Dai with Alice',
    to: user.email,
    data: {
      user: user,
      donation: donation,
      title: 'Dai donation received',
      subtitle: 'Thank you!'
    },
    type: "DaiDonationConfirmationDontaionReceived"
  });
};

Mail.sendContactMessage = function (message) {
  var prom = MailSender.requestSending({
    template: 'contactMessage.mustache',
    subject: 'Start project message',
    to: 'connect@alice.si',
    data: {
      message: message,
      title: 'Start project message',
      subtitle: 'Message received'
    },
    type: "ContactMessage"
  });
  return prom;
};

Mail.sendPasswordReset = function (user) {
  return MailSender.requestSending({
    template: 'passwordReset.mustache',
    subject: 'Alice password reset',
    to: user.email,
    data: {
      user: user,
      title: 'Alice password reset',
      subtitle: 'Password reset'
    },
    type: "PasswordReset"
  });
};

Mail.sendImpactConfirmation = function (user, project, impact) {
  impact.money = formatMoney(impact.amount);
  return MailSender.requestSending({
    template: 'impactConfirmation.mustache',
    subject: 'Donation paid',
    to: user.email,
    data: {
      user: user,
      project: project,
      impact: impact,
      title: 'Donation paid',
      subtitle: 'Success!'
    },
    type: 'ImpactConfirmation'
  });
};

function prepareDonationBankInfo(donation) {
  let idFieldName, idValue;
  const account = donation.bankTransferData.account;
  switch (donation.bankTransferData.account.Type) {
    case 'IBAN':
      idFieldName = 'IBAN';
      idValue = account.IBAN;
      break;
    case 'GB':
      idFieldname = 'Sort code and account number';
      idValue = account.SortCode + ' ' + account.AccountNumber;
      break;
    default:
      idFieldname = 'Account number';
      idValue = account.AccountNumber;
      break;
  }

  donation.bankTransferData.account.idFieldname = idFieldName;
  donation.bankTransferData.account.idValue = idValue;

  return donation;
}

module.exports = Mail;
