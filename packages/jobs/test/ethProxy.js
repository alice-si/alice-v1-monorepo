const TestUtils = require('../utils/test-utils');
const logger = require('../utils/logger')('test/ethProxy');
const EthProxy = require('../gateways/ethProxy');
const AliceToken = artifacts.require('AliceToken');
const Project = artifacts.require('Project');
const Token = artifacts.require('AliceToken');

contract('EthProxy', function (accounts) {
  let mocks,
    projectAddress,
    tokenAddress,
    validator,
    project,
    token,
    validationId = '58e6695d7b16403e108e8f1a',
    testAccount = accounts[3];

  TestUtils.setBeforeAndAfterHooksForJobTest();

  it('should create test model', async function () {
    mocks = await TestUtils.prepareMockObjects('owner', 'CREATED', 'CREATED');
    const addresses = mocks.project.ethAddresses;
    projectAddress = addresses.project;
    tokenAddress = addresses.token;
    validator = addresses.validator;
    impactRegistryAddress = addresses.impact;
    token = Token.at(tokenAddress);
    project = Project.at(projectAddress);
  });

  it('should mint', async function () {
    let mintedAmount = 1000;
    let amountBefore = await token.balanceOf(projectAddress);
    await EthProxy.mint(mocks.project, mintedAmount);
    (await token.balanceOf(projectAddress)).should.be.bignumber.equal(mintedAmount + amountBefore.toNumber());
  });

  it('should deposit', async function () {
    let amount = 1000;
    let totalBefore = await project.total();
    let balanceBefore = (await project.getBalance(testAccount));
    await EthProxy.deposit(testAccount, mocks.project, amount);
    (await project.total()).should.be.bignumber.equal(amount + totalBefore.toNumber());
    balanceAfter = (await project.getBalance(testAccount));
    balanceAfter.should.be.bignumber.equal(balanceBefore.plus(amount));
    logger.info('Balance before: ' + balanceBefore.toNumber() + ' Balance after: ' + balanceAfter.toNumber());
  });

  it('should claim and validate outcome', async function () {
    let projectBalance = (await (Token.at(tokenAddress)).balanceOf(projectAddress));
    let validation = {
      _id: validationId,
      amount: projectBalance
    };
    await EthProxy.deposit(testAccount, mocks.project, projectBalance);
    await EthProxy.claimOutcome(mocks.project, validation, '');
    await EthProxy.validateOutcome(mocks.project, validation, validator, '');
    (await token.balanceOf.call(projectAddress)).should.be.bignumber.equal(0);
  });

  // TODO test it better
  it('should fetch impact', async function () {
    await EthProxy.fetchImpact(mocks.project, validationId).should.be.fulfilled;
  });

  // TODO test it better
  it('should get impact linked', async function () {
    await EthProxy.getImpactLinked(mocks.project, validationId).should.be.fulfilled;
  });

  // TODO test it better
  it('should link impact', async function () {
    await EthProxy.linkImpact(mocks.project, validationId).should.be.fulfilled;
  });
});
