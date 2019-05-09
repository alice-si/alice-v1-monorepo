const TestUtils = require('../utils/test-utils');
const ModelUtils = require('../utils/model-utils');
const Moment = require('moment');
const Donation = ModelUtils.loadModel('donation');
const Mail = ModelUtils.loadModel('mail');
const DonationStatusCheckingJob = require('../jobs/donationStatusCheckingJob');
const MailSendingJob = require('../jobs/mailSendingJob');
const Config = require('../config');

TestUtils.setBeforeAndAfterHooksForJobTest();

const SHOULD_TEST_EMAIL_SENDING = true;

contract('DonationStatusCheckingJob', async function () {
  const timeout = 500;
  let donations = {};

  it('should create test donations', async function () {
    for (let i = 0; i < 10; i++) {
      console.log('Creating donation');
      donations[i] = await new Donation({
        status: 'FAILED',
        errorChecked: i > 7,
        createdAt: (new Moment()).subtract(Config.stalledDonationTimeout * 2, 's').toDate()
      }).save();
      console.log('Donation created ' + donations[i]._id);
    }
    
  });

  it('Execute DonationStatusChecking job', async function () {
    await DonationStatusCheckingJob.execute();
  });

  it('Mail for developers should be created', function (done) {
    setTimeout(async function () {
      mails = await Mail.find();
      mails.length.should.be.gt(0);
      done();
    }, timeout);
  });

  it('Checking email sending if needed', async function () {
    if (SHOULD_TEST_EMAIL_SENDING) {
      await MailSendingJob.execute();
      await setTimeout(async function () {
        let mail = Mail.findOne();
        mail.status.should.be.equal('MAIL_SENDING_COMPLETED');
        mail.sendDate.should.be.a('date');
      }, timeout);
    }
  });
});
