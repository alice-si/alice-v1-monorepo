const expect = require('chai').expect;

const ClaimingJob = require('../jobs/ClaimingJob');
const EthProxy = require('../gateways/ethProxy');
const ModelUtils = require('../utils/model-utils');
const TestUtils = require('../utils/test-utils');
const config = require('../config');

const Validation = ModelUtils.loadModel('validation');

contract('ClaimingJob', async () => {
  let mocks, validation;

  TestUtils.setBeforeAndAfterHooksForJobTest();

  step('test model is created', async () => {
    mocks = await TestUtils.prepareMockObjects(
      'claimer', 'COLLECTING_COMPLETED', 'CREATED');
    validation = mocks.validation;
  });

  step('donation is processed', async () => {
    await EthProxy.mint(mocks.project, validation.amount);
    await EthProxy.deposit(
      mocks.project.ethAddresses.owner, mocks.project, validation.amount);
  });

  step('job sends transaction', async () => {
    await new ClaimingJob().execute();
  });

  step('validation should have status CLAIMING_IN_PROGRESS', async () => {
    await TestUtils.testStatus(
      Validation, 'CLAIMING_IN_PROGRESS', mocks.validation._id);
  });

  step('job checks transaction', async () => {
    await new ClaimingJob().execute();
  });

  step('validation should have status CLAIMING_COMPLETED', async () => {
    await TestUtils.testStatus(
      Validation, 'CLAIMING_COMPLETED', mocks.validation._id);
  });
});
