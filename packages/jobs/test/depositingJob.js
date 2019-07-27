const TestUtils = require('../utils/test-utils');
const ModelUtils = require('../utils/model-utils');
const DepositingJob = require('../jobs/DepositingJob');
const Donation = ModelUtils.loadModel('donation');

contract('DepositingJob', async function (accounts) {
  let mocks;

  TestUtils.setBeforeAndAfterHooksForJobTest();

  it('should create test model', async function () {
    mocks = await TestUtils.prepareMockObjects('owner', 'MINTING_COMPLETED', 'CREATED');
  });

  it('should execute depositing job', async function () {
    await new DepositingJob().execute();
  });

  it('donation should have status DEPOSITING_IN_PROGRESS', async () => {
    await TestUtils.testStatus(
      Donation, 'DEPOSITING_IN_PROGRESS', mocks.donation._id);
  });

  it('should execute checker part for depositing job', async function () {
    await new DepositingJob().execute();
  });

  it('donation should have status DONATED', async () => {
    await TestUtils.testStatus(
      Donation, 'DONATED', mocks.donation._id);
  });
});
