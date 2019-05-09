const TestUtils = require('../utils/test-utils');
const ModelUtils = require('../utils/model-utils');
const LinkingJob = require('../jobs/linkingJob');
const Validation = ModelUtils.loadModel('validation');
const EthProxy = require('../gateways/ethProxy');

contract('LinkingJob', async function () {
  let mocks;

  TestUtils.setBeforeAndAfterHooksForJobTest();

  it('should create test model', async function () {
    mocks = await TestUtils.prepareMockObjects('validator', 'CREATED', 'VALIDATING_COMPLETED');
  });

  it('should prepare contracts to link validation', async function () {
    let validator = mocks.project.ethAddresses.validator;
    let owner = mocks.project.ethAddresses.owner;
    let amount = mocks.validation.amount;
    await EthProxy.mint(mocks.project, amount);
    await EthProxy.deposit(owner, mocks.project, amount);
    await EthProxy.claimOutcome(mocks.project, mocks.validation, '');
    await EthProxy.validateOutcome(
      mocks.project, mocks.validation, validator, '');
  });

  it('should execute linking job', async function () {
    await LinkingJob.execute();
  });

  it('validation should have status LINKING_IN_PROGRESS', async () => {
    await TestUtils.testStatus(
      Validation, 'LINKING_IN_PROGRESS', mocks.validation._id);
  });

  it('should execute linking job checker', async function () {
    await LinkingJob.check();
  });

  // It is not a bug - it is an odd job mechanism
  it('validation should have status LINKING_STEP_COMPLETED', async () => {
    await TestUtils.testStatus(
      Validation, 'LINKING_STEP_COMPLETED', mocks.validation._id);
  });

  it('should execute linking job again', async function () {
    await LinkingJob.execute();
  });

  it('validation should have status LINKING_COMPLETED', async () => {
    await TestUtils.testStatus(
      Validation, 'LINKING_COMPLETED', mocks.validation._id);
  });
});
