const TestUtils = require('../utils/test-utils');
const ModelUtils = require('../utils/model-utils');
const logger = require('../utils/logger')('test/donationStatusCheckingJob');
const Moment = require('moment');
const Donation = ModelUtils.loadModel('donation');
const Mail = ModelUtils.loadModel('mail');
const DonationStatusCheckingJob = require('../jobs/donationStatusCheckingJob');
const MailSendingJob = require('../jobs/mailSendingJob');
const Config = require('../config');

const SHOULD_TEST_EMAIL_SENDING = true;

contract('DonationStatusCheckingJob', async function () {
  const timeout = 500;
  let donations = {};

  TestUtils.setBeforeAndAfterHooksForJobTest();

  it('should create test donations', async function () {
    for (let i = 0; i < 10; i++) {
      logger.info('Creating donation');
      donations[i] = await new Donation({
        status: 'FAILED',
        errorChecked: i > 7,
        createdAt: (new Moment()).subtract(Config.stalledDonationTimeout * 2, 's').toDate()
      }).save();
      logger.info('Donation created ' + donations[i]._id);
    }
    
  });

  it('Execute DonationStatusChecking job', async function () {
    await DonationStatusCheckingJob.execute();
  });

  it('Mail for developers should be created', async () => {
    await sleep();
    mails = await Mail.find();
    mails.length.should.be.gt(0);
  });

  it('Checking email sending if needed', async () => {
    if (SHOULD_TEST_EMAIL_SENDING) {
      await MailSendingJob.execute();
      await sleep();
      let mail = await Mail.findOne();
      mail.status.should.be.equal('MAIL_SENDING_COMPLETED');
      mail.sendDate.should.be.a('date');
    }
  });

  async function sleep() {
    await new Promise(resolve => setTimeout(resolve, timeout));
  }
});
