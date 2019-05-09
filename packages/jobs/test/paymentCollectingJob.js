const TestUtils = require('../utils/test-utils');
const ModelUtils = require('../utils/model-utils');
const Donation = ModelUtils.loadModel('donation');
const PaymentCollectingJob = require('../jobs/paymentCollectingJob');
const Mango = require('../gateways/mangoProxy');
const request = require('request-promise');

contract('PaymentCollectingJob', async function (accounts) {
  let mocks;

  TestUtils.setBeforeAndAfterHooksForJobTest();

  it('should create test model', async function () {
    mocks = await TestUtils.prepareMockObjects('owner', 'CREATED', 'CREATED', 33);
  });

  it('should pay money to user mango account', async function () {
    await TestUtils.payInToUserAccount(mocks.user, mocks.donation.amount);
  });

  it('should execute payment collecting job', async function () {
    await PaymentCollectingJob.execute();
  });

  it('donation should have status COLLECTING_COMPLETED', async () => {
    await TestUtils.testStatus(
      Donation, 'COLLECTING_COMPLETED', mocks.donation._id);
  });
});
