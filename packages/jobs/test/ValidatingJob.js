const TestUtils = require('../utils/test-utils'); // TestUtils must be included firstly
const ClaimingJob = require('../jobs/ClaimingJob');
const EthProxy = require('../gateways/ethProxy');
const ModelUtils = require('../utils/model-utils');
const ContractUtils = require('../utils/contract-utils');
const ValidatingJob = require('../jobs/ValidatingJob');
const ethers = require('ethers');

const Validation = ModelUtils.loadModel('validation');

contract('ValidatingJob', async () => {
  let mocks, validation;

  TestUtils.setBeforeAndAfterHooksForJobTest();

  step('test model is created', async () => {
    mocks = await TestUtils.prepareMockObjects(
      'validator', 'COLLECTING_COMPLETED', 'CREATED');
    validation = mocks.validation;
  });

  step('donation is processed', async () => {
    await EthProxy.mint(mocks.project, validation.amount);
    await EthProxy.deposit(
      mocks.project.ethAddresses.owner, mocks.project, validation.amount);
  });

  step('should unload validator account', async () => {
    let validator = mocks.project.ethAddresses.validator;
    let validatorWallet = await ContractUtils.getWallet({
      address: validator
    });
    await validatorWallet.sendTransaction({
      to: ContractUtils.mainWallet.address,
      value: ethers.utils.parseEther('99.999') // We save about 0.001 ethers for gas
    });
  });

  step('claiming job sends transaction', async () => {
    await new ClaimingJob().execute();
  });

  step('validation should have status CLAIMING_IN_PROGRESS', async () => {
    await TestUtils.testStatus(
      Validation, 'CLAIMING_IN_PROGRESS', mocks.validation._id);
  });

  step('claiming job checks transaction', async () => {
    await new ClaimingJob().execute();
  });

  step('validation should have status CLAIMING_COMPLETED', async () => {
    await TestUtils.testStatus(
      Validation, 'CLAIMING_COMPLETED', mocks.validation._id);
  });

  step('validation should not be processed before approval', async () => {
    await new ValidatingJob().execute();
    await TestUtils.testStatus(
      Validation, 'CLAIMING_COMPLETED', mocks.validation._id);
  });

  step('validation is approved', async () => {
    // Normally this is the stage where _validatorId is set,
    // but for convenience in tests they are set on creation.
    validation.status = 'APPROVED';
    validation.save();
  });

  step('validating job sends transaction', async () => {
    await new ValidatingJob().execute();
  });

  step('validation should have status VALIDATING_IN_PROGRESS', async () => {
    await TestUtils.testStatus(
      Validation, 'VALIDATING_IN_PROGRESS', mocks.validation._id);
  });

  step('validating job checks transaction', async () => {
    await new ValidatingJob().execute();
  });

  step('validation should have status VALIDATING_COMPLETED', async () => {
    await TestUtils.testStatus(
      Validation, 'VALIDATING_COMPLETED', mocks.validation._id);
  });
});
