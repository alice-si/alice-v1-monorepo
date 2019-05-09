// This tool could be used to test mails sending
// It could be runned by node tools/send-test-mails.js
// This script saves email requests to mock db and starts the mailSendingJob
// If you see repeating "no model found. skipping..." please finish script executing (ctrl+c) 

const TestUtils = require('../utils/test-utils');
const MailUtils = require('../utils/mail-utils');
const MailSendingJob = require('../jobs/mailSendingJob');

async function prepare() {
  await TestUtils.connectToMockDB();
  console.log('Connected to mock DB.');
  let mocks = await TestUtils.prepareMockObjects(
    'owner',
    'COLLECTING_COMPLETED',
    'CREATED'
  );
  await MailUtils.sendStalledDonationsNotification('Test mail sending', []);
  await MailUtils.sendErrorNotification('Test', 'Just a test', 'No error');
  const impact = {
    _id: '12345678',
    amount: 10
  };
  mocks.project.charity.legalName = 'Charity Legal Name';
  await MailUtils.sendImpactConfirmation(mocks.user, mocks.project, impact);
}

async function run() {
  await prepare();
  await sendMails();
  await addRepeatedErrorMessages();
  await sendMails();
  process.exit(0);
}

async function sendMails() {
  maxSendingTries = 20;
  for (let i = 0; i < maxSendingTries; i++) {
    await MailSendingJob.execute();
  }
}

async function addRepeatedErrorMessages() {
  // Should not save these error messages requests
  const repeatedMailsNumber = 10;
  for (let i = 0; i < repeatedMailsNumber; i++) {
    await MailUtils.sendErrorNotification('Test', 'Just a test', 'No error');
  }
}

run();