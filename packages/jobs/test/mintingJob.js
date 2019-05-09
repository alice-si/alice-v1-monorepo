const TestUtils = require('../utils/test-utils');
const ModelUtils = require('../utils/model-utils');
const MintingJob = require('../jobs/mintingJob');
const Donation = ModelUtils.loadModel('donation');

contract('MintingJob', async function (accounts) {
  let mocks;

  TestUtils.setBeforeAndAfterHooksForJobTest();

  it('should create test model', async function () {
    mocks = await TestUtils.prepareMockObjects('owner', 'COLLECTING_COMPLETED', 'CREATED');
  });

  it('should execute minting job', async function () {
    await MintingJob.execute();
  });

  it('donation should have status MINTING_IN_PROGRESS', async () => {
    await TestUtils.testStatus(
      Donation, 'MINTING_IN_PROGRESS', mocks.donation._id);
  });

  it('should execute minting job checker', async function () {
    await MintingJob.check();
  });

  it('donation should have status MINTING_COMPLETED', async () => {
    await TestUtils.testStatus(
      Donation, 'MINTING_COMPLETED', mocks.donation._id);
  });
});
