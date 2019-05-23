const TestUtils = require('../test/test-utils');
const MailService = require('../devServer/service/mail');
const Utils = require('../devServer/service/utils');
const Mail = Utils.loadModel('mail');
const Promise = require('bluebird');
const Aws = require('aws-sdk');
const Config = require('../config');

run().then(() => {
  console.log('Test mail sending finished.');
  process.exit(0);
}).catch((err) => {
  console.log('Error occured: ' + JSON.stringify(err));
  process.exit(1);
});

async function run() {
  const mocks = await prepare();
  const newMocks = {
    user: mocks.users[0],
    project: mocks.projects[0],
    donation: mocks.donations[0]
  };
  console.log(newMocks);
  await saveMailRequests(newMocks);
  await sendMails();
  await TestUtils.removeTestDB();
}

async function prepare() {
  await TestUtils.connectToTestDB();
  return await TestUtils.createTestObjects();
}

async function sendMails() {
  mailsNumber = 10;
  for (let i = 0; i < mailsNumber; i++) {
    let mail = await Mail.findOne({status: 'CREATED'});
    if (mail) {
      console.log("SENDING MAIL " + mail._id);
      await sendMail(mail);
      mail.status = 'MAIL_SENDING_COMPLETED';
      await mail.save();
    } else {
      console.log('No mails were found. Skipping...');
    }
  }
}

async function saveMailRequests(mocks) {
  await MailService.sendAccountConfirmation(mocks.user);
  await MailService.sendDonationError(mocks.user, mocks.project, "There is no error");
  await MailService.sendDonationError(mocks.user, mocks.project, "There is no error - testing with 3DS", true);
  await MailService.sendDonationConfirmation(mocks.user, mocks.project, mocks.donation);
  await MailService.sendDaiDonationConfirmation(mocks.user, mocks.donation);
  await MailService.sendContactMessage({
    email: 'tom@tester.si',
    name: 'Tom',
    message: 'Just a test message'
  });
  await MailService.sendPasswordReset(mocks.user);
  mocks.donation.bankTransferData = {
    "account": {
      "OwnerAddress": {"AddressLine1": "leetchi loop", "AddressLine2": null, "City": "paris", "Region": "paris region", "PostalCode": "75009", "Country": "FR"},
      "Type": "IBAN",
      "OwnerName":"Leetchi Corp SA",
      "IBAN": "LU320141444892503030",
      "BIC": "CELLLULL"
    },
    "wireReference": "eb4ecf84ca"
  };
  await MailService.sendBankTransferRequestConfirmation(mocks.user, mocks.project, mocks.donation);
}

// This is almost a copy of send Function from alice-eth/gateways/mailProxy.js
function sendMail(mail) {
  const API_VERSION = '2010-12-01';
  const CHARSET = 'UTF-8';

  Aws.config.update({region: Config.awsSesRegion});

  return new Promise(function (resolve, reject) {
    var params = {
      Destination: {
        // CcAddresses: getCC(mail),
        // ToAddresses: getRecipients(mail)
        CcAddresses: ["alice@alice.si"],
        ToAddresses: []
      },
      Message: {
        Body: {
          Html: {
            Charset: CHARSET,
            Data: mail.html
          }
        },
        Subject: {
          Charset: CHARSET,
          Data: mail.subject
        }
      },
      Source: mail.from,
      ReplyToAddresses: [],
    };
    var sendPromise = new Aws.SES({apiVersion: API_VERSION}).sendEmail(params).promise();

    sendPromise.then(
      function (data) {
        // mailProxyLog("Mail sent: " + data.MessageId);
        console.log("Mail sent: " + data.MessageId);
        resolve(data);
      }).catch(
        function (err) {
          // mailProxyLog("Error occured: " + JSON.stringify(err));
          console.log("Error occured: " + JSON.stringify(err));
          reject(err);
        });
  });
}