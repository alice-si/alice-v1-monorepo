const TestUtils = require('../utils/test-utils');
const ModelUtils = require('../utils/model-utils');
const DepositingJob = require('../jobs/depositingJob');
const Donation = ModelUtils.loadModel('donation');

TestUtils.setBeforeAndAfterHooksForJobTest();

contract('DepositingJob', async function (accounts) {
  let mocks;

  it('should create test model', async function () {
    mocks = await TestUtils.prepareMockObjects('owner', 'MINTING_COMPLETED', 'CREATED');
  });

  it('should execute depositing job', async function () {
    await DepositingJob.execute();
  });

  it('donation should have status DEPOSITING_IN_PROGRESS', function (done) {
    TestUtils.testStatus(Donation, 'DEPOSITING_IN_PROGRESS', mocks.donation._id, done);
  });

  it('should execute checker part for depositing job', async function () {
    await DepositingJob.check();
  });

  it('donation should have status DONATED', function (done) {
    TestUtils.testStatus(Donation, 'DONATED', mocks.donation._id, done);
  });
});