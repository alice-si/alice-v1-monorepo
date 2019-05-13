const config = require('../config');
const TestConfig = require('../test-config');
const ModelUtils = require('./model-utils');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ContractUtils = require('./contract-utils');
const web3 = ContractUtils.getWeb3();
const BigNumber = web3.BigNumber;
const MangoProxy = require('../gateways/mangoProxy');
const KeyProxy = require('../gateways/keyProxy');
const Deploy = require('../utils/deploy');
const request = require('request-promise');
const Promise = require('bluebird');

const Validation = ModelUtils.loadModel('validation');
const Donation = ModelUtils.loadModel('donation');
const User = ModelUtils.loadModel('user');
const Project = ModelUtils.loadModel('project');
const Charity = ModelUtils.loadModel('charity');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();
require('mocha-steps');

Promise.prototype.shouldBeReverted = async function () {
  await this.should.be.rejectedWith('VM Exception while processing transaction: revert');
};

let TestUtils = {};

let mongoServer;

TestUtils.getDefaultProjectCode = function () {
  return TestConfig.defaultProjectName;
};

TestUtils.connectToMockDB = async function () {
  mongoServer = new MongoMemoryServer();

  mongoose.Promise = Promise;
  const mongoUri = await mongoServer.getConnectionString();
  const mongooseOpts = {
    // options for mongoose 4.11.3 and above
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
  };

  await new Promise((resolve, reject) => {
    mongoose.connect(mongoUri, mongooseOpts);

    mongoose.connection.on('error', (e) => {
      reject(e);
    });
  
    mongoose.connection.once('open', () => {
      resolve();
    });
  });
};

TestUtils.resetMockDB = async () => {
  // mongoose.disconnect();
  await mongoServer.stop();
};

TestUtils.createDefaultMockProject = async (
  user,
  projectCode,
  ethAddresses,
  status = 'ACTIVE',
  upfrontPayment = 0
) => {
  const birthday = 4327776000;
  const charityName = 'StMungo';

  let responsible = user.toObject();
  responsible.birthday = birthday;
  let charityMangoUserId = await MangoProxy.registerCharity(charityName, responsible);
  let mangoWallets = await MangoProxy.registerWalletsForProject({
    code: projectCode,
    charity: {
      mangoUserId: charityMangoUserId
    }
  });

  // charity creating
  const charity = await new Charity({
    code: 'charityFor' + projectCode,
    name: 'charityNameFor' + projectCode,
    legalName: 'charityLegalNameFor' + projectCode,
    mangoUserId: charityMangoUserId
  }).save();

  console.log('Project creating');
  let project = await new Project({
    code: projectCode,
    title: projectCode + '_TITLE_',
    status: status,
    charity: charity._id,
    upfrontPayment: upfrontPayment,
    mangoContractWalletId: mangoWallets.contractWalletId,
    mangoBeneficiaryWalletId: mangoWallets.beneficiaryWalletId,
    ethAddresses: ethAddresses,
  }).save();

  console.log('Project created: ' + project._id);
  return project;
};

TestUtils.createDefaultMockUser = async function (postfix, ethAccount, charity, validator) {
  const crypto = KeyProxy.encrypt(TestConfig.defaultPassword);

  let testUserObj = {
    email: 'test_email@gmail.com' + postfix,
    crypto: crypto,
    ethAccount: ethAccount,
    firstName: 'Tom' + postfix,
    lastName: 'Tester' + postfix,
    dateOfBirth: new Date('1983-09-18 22:00:00.000Z'),
    nationality: 'PL',
    residence: 'PL',
    birthday: 4327776000
  };

  if (charity) {
    testUserObj.charityAdmin = charity;
  }
  if (validator) {
    testUserObj.validator = [validator];
  }

  console.log('User creating');

  let user = new User(testUserObj);
  let userWithMango = await MangoProxy.registerUser(user);
  let userCreated = await userWithMango.save();

  return userCreated;
};

TestUtils.createDefaultMockDonation = async function (userId, projectId, status, amount) {
  console.log('Donation creating');
  let donation = new Donation({
    _userId: userId,
    _projectId: projectId,
    status: status,
    amount: amount
  });
  let donationCreated = await donation.save();

  return donationCreated;
};

TestUtils.createDefaultMockValidation = async (
  claimerId,
  validatorId,
  projectId,
  status,
  amount
) => {
  console.log('Validation creating');
  let validation = new Validation({
    amount,
    status,
    _projectId: projectId,
    _claimerId: claimerId,
    _validatorId: validatorId,
  });
  let validationCreated = await validation.save();

  return validationCreated;
};

/** Deploys contracts with default values and returns their addresses. */
TestUtils.deployDefault = async () => {
  let accounts = await Promise.promisify(web3.eth.getAccounts)();

  let claimsRegistryAddress = await Deploy.deployClaimsRegistry(accounts[0]);
  let project = {
    code: TestUtils.getDefaultProjectCode(),
    ethAddresses: {
      claimsRegistry: claimsRegistryAddress,
    },
    upfrontPayment: 0,
  };

  let addresses = await Deploy.deployProject(
    accounts[0],
    accounts[1],
    accounts[2],
    claimsRegistryAddress,
    project,
    null);
  return addresses;
};

// This function deploys contracts and created mock instances in mocked BD
TestUtils.prepareMockObjects = async (
  userRole,
  donationStatus,
  validationStatus,
  upfrontPayment = 0
) => {
  let addresses = await TestUtils.deployDefault();

  const testAmount = 10;

  let userCreated;
  let claimerCreated = await TestUtils.createDefaultMockUser(
    'claimer', addresses['beneficiary']);
  let validatorCreated = await TestUtils.createDefaultMockUser(
    'validator', addresses['validator']);

  switch (userRole) {
  case 'validator': userCreated = validatorCreated; break;
  case 'claimer': userCreated = claimerCreated; break;
  default: userCreated = await TestUtils.createDefaultMockUser(
    '', addresses[userRole]);
  }

  let projectCreated = await TestUtils.createDefaultMockProject(
    userCreated,
    TestUtils.getDefaultProjectCode(),
    addresses,
    'ACTIVE',
    upfrontPayment);
  let donationCreated = await TestUtils.createDefaultMockDonation(
    userCreated._id, projectCreated._id, donationStatus, testAmount);
  let validationCreated = await TestUtils.createDefaultMockValidation(
    claimerCreated._id,
    validatorCreated._id,
    projectCreated._id,
    validationStatus,
    testAmount);

  let result = {
    donation: donationCreated,
    validation: validationCreated,
    project: projectCreated,
    user: userCreated
  };
  console.log(result);

  return result;
};

TestUtils.payInToUserAccount = async function(user, amount) {
  let preRegistrationData = await MangoProxy.preRegisterCard(user);
  let cardData = {
    accessKeyRef: preRegistrationData.AccessKey,
    data: preRegistrationData.PreregistrationData,
    cardNumber: '4706750000000009',
    cardExpirationDate: '1119',
    cardCvx: '123'
  };

  let registeredData = await request({
    method: 'POST',
    uri: preRegistrationData.CardRegistrationURL,
    form: cardData
  });

  preRegistrationData.RegistrationData = registeredData;
  let registrationData = await MangoProxy.updateCardRegistration(preRegistrationData);

  await MangoProxy.payIn(user, amount, registrationData.CardId);
};

TestUtils.testStatus = async (model, status, id) => {
  // sleep
  await new Promise(resolve => setTimeout(resolve, 1000 /*ms*/));
  console.log(`Checking for ${status} status...`);
  let modelInstance = await model.findOne({ _id: id });
  modelInstance.status.should.be.equal(status);
};

TestUtils.prepareMockObjectsForLoadTest = async function (numberOfUsers) {
  const accounts = await Promise.promisify(web3.eth.getAccounts)();
  // we need to have eth validator account to be able to deploy project with job
  const validatorEthAccount = accounts[5];
  let mainUser = await TestUtils.createDefaultMockUser('', config.mainAccount);
  let testAmount = 10;

  // Deploy and configure claims registry.
  let claimsRegistryAddress = await Deploy.deployClaimsRegistry(
    config.mainAccount, config.mainPassword);
  Object.assign(config, { claimsRegistryAddress });

  let projectToDeploy = await TestUtils.createDefaultMockProject(
    mainUser, TestUtils.getDefaultProjectCode(), {},  'CREATED');
  let validator = await TestUtils.createDefaultMockUser(
    'testValidator', validatorEthAccount, null, projectToDeploy._id);
  let charityAdmin = await TestUtils.createDefaultMockUser(
    'testCharityAdmin', project.ethAddresses['beneficiary'], projectToDeploy.charity, null);

  for (let i = 0; i < numberOfUsers; i++) {
    console.log((i + 1) + '/' + numberOfUsers);
    let user = await TestUtils.createDefaultMockUser(i.toString(), null);
    await TestUtils.payInToUserAccount(user, testAmount);
    await TestUtils.createDefaultMockDonation(user._id, projectToDeploy._id, 'CREATED', testAmount);
  }
};

TestUtils.createMockValidations = async function () {
  console.log('Mock validation creating started...');
  const claimer = await User.findOne({ charityAdmin: {$ne: null} });
  const validator = await User.findOne({validator: { $gt: [] }});

  let donations = await Donation.find();
  let total = donations.length;
  donations.forEach(async function (donation, i) {
    console.log((i + 1) + '/' + total);
    await TestUtils.createDefaultMockValidation(
      claimer._id,
      validator._id,
      donation._projectId,
      'CREATED',
      donation.amount);
  });
};

TestUtils.setBeforeAndAfterHooksForJobTest = function () {
  before(async function () {
    await TestUtils.connectToMockDB();
    console.log('Connected to mock DB.');
  });

  after(async function () {
    await TestUtils.resetMockDB();
    console.log('Mock DB was reset.');
  });
};

module.exports = TestUtils;
