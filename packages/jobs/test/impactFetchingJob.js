const TestUtils = require('../utils/test-utils');
const ModelUtils = require('../utils/model-utils');
const ImpactFetchingJob = require('../jobs/impactFetchingJob');
const MailSendingJob = require('../jobs/MailSendingJob');
const EthProxy = require('../gateways/ethProxy');
const logger = require('../utils/logger')('test/impactFetchingJob');

const Validation = ModelUtils.loadModel('validation');
const Mail = ModelUtils.loadModel('mail');

const SHOULD_TEST_EMAIL_SENDING = false;

contract('ImpactFetchingJob', async function () {
  let mocks, validator;

  TestUtils.setBeforeAndAfterHooksForJobTest();

  it('should create test model', async function () {
    mocks = await TestUtils.prepareMockObjects('validator', 'CREATED', 'LINKING_COMPLETED');
    validator = mocks.project.ethAddresses.validator;
    logger.info('User has an ethAccount: ' + mocks.user.ethAccount);
  });

  it('should prepare contracts for impactFetching', async function () {
    let amount = mocks.validation.amount;
    let validationId = mocks.validation._id.toString();
    await EthProxy.mint(mocks.project, amount);
    await EthProxy.deposit(validator, mocks.project, amount);
    await EthProxy.claimOutcome(mocks.project, mocks.validation, '');
    await EthProxy.validateOutcome(mocks.project, mocks.validation, validator, '');
    await EthProxy.linkImpact(mocks.project, validationId);
  });

  it('should execute ImpactFetching job', async function () {
    await ImpactFetchingJob.execute();
  });

  it('validation should have status IMPACT_FETCHING_COMPLETED', async () => {
    await TestUtils.testStatus(
      Validation, 'IMPACT_FETCHING_COMPLETED', mocks.validation._id);
  });

  it('should send impact confirmation', async function () {
    if (SHOULD_TEST_EMAIL_SENDING) {
      await new MailSendingJob().execute();
      let mail = await Mail.findOne({});
      await TestUtils.testStatus(Mail, 'MAIL_SENDING_COMPLETED', mail);
    }
  });
});
