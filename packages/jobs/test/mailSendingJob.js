const TestUtils = require('../utils/test-utils');
const ModelUtils = require('../utils/model-utils');
const Mail = ModelUtils.loadModel('mail');
const MailSendingJob = require('../jobs/mailSendingJob');

TestUtils.setBeforeAndAfterHooksForJobTest();

contract('MailSendingJob', async function () {
  const timeout = 500;
  let mail;

  it('Should create test mail', async function () {
    mail = await new Mail({
      from: 'alice@alice.si',
      to: 'alex@alice.si',
      subject: 'Test',
      html: '<h1>It\'s a test</h1>'
    }).save();
  });

  it('Mail should be found', async function () {
    const mailFound = await Mail.findOne({status: 'CREATED'});
    mailFound.should.not.be.null;
  });

  it('Should execute mailSending job', async function () {
    await MailSendingJob.execute();
  });

  it('Mail should be sent', function (done) {
    setTimeout(async function () {
      const mailFound = await Mail.findById(mail._id);
      mailFound.status.should.be.equal('MAIL_SENDING_COMPLETED');
      mailFound.sendDate.should.be.a('date');
      done();
    }, timeout);
  });
});

