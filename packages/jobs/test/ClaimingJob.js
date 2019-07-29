const TestUtils = require('../utils/test-utils'); // TestUtils must be included firstly
const ClaimingJob = require('../jobs/ClaimingJob');
const EthProxy = require('../gateways/ethProxy');
const ModelUtils = require('../utils/model-utils');
const ContractUtils = require('../utils/contract-utils');
const ethers = require('ethers');

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

  step('should unload claimer account', async () => {
    let beneficiary = mocks.project.ethAddresses.beneficiary;
    let beneficiaryWallet = await ContractUtils.getWallet({
      address: beneficiary
    });
    await beneficiaryWallet.sendTransaction({
      to: ContractUtils.mainWallet.address,
      value: ethers.utils.parseEther('99.999') // We save about 0.001 ethers for gas
    });
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
