const Promise = require('bluebird');
const request = require('request');
const ethers = require('ethers');

const ContractUtils = require('../utils/contract-utils');
const ModelUtils = require('../utils/model-utils');
const ContractProxy = require('./contractProxy');
const Deploy = require('../utils/deploy');
const logger = require('../utils/logger')('gateways/ethProxy');
const config = require('../config');

const EthAddress = ModelUtils.loadModel('ethAddress');

let EthProxy = {};

EthProxy.createNewAddress = async function () {
  const lastEthAddress = await EthAddress.findOne(
    { index: { $exists: true } }
  ).sort('-index');
  const index = lastEthAddress ? lastEthAddress.index + 1 : 1;
  let newEthAddress = await new EthAddress({ index }).save();

  newEthAddress.address = await ContractUtils.getWalletForIndex(index).address;  
  await newEthAddress.save();

  return newEthAddress.address;
};

EthProxy.deposit = async (fromUserAccount, project, amount) => {
  let contracts = await ContractProxy.getAllContractsForDocument(project);
  logger.info('Depositing: ' + JSON.stringify({
    from: fromUserAccount,
    to: contracts.project.address,
    amount: amount
  }));
  let transaction = await contracts.project.notify(
    fromUserAccount, amount);
  return getTxHash(transaction);
};

EthProxy.mint = async (project, amount) => {
  logger.info('Minting: ' + amount);
  let contracts = await ContractProxy.getAllContractsForDocument(project);
  return getTxHash(await contracts.token.mint(contracts.project.address, amount));
};

EthProxy.validateOutcome = async (
  project, validation, validatorAccount
) => {
  logger.info(
    `Validating outcome, validation id: ${validation._id}, ` +
    `amount: ${validation.amount}, account: ${validatorAccount}`);

  let contracts = await ContractProxy.getAllContractsForDocument(
    project,
    validatorAccount);

  let idBytes = mongoIdToBytes(validation._id);
  let transaction = await contracts.project.validateOutcome(
    idBytes, validation.amount);

  return getTxHash(transaction);
};

EthProxy.claimOutcome = async (project, validation) => {
  logger.info(
    `Claiming outcome, validation id: ${validation._id}, ` +
    `amount: ${validation.amount}`);

  let beneficiary = project.ethAddresses['beneficiary'];

  let claimsRegistry = await ContractUtils.getContractInstance(
    'ClaimsRegistry',
    project.ethAddresses['claimsRegistry'],
    beneficiary);

  let claimKey = mongoIdToBytes(validation._id);
  let claimValue = numberToBytes(validation.amount);
  let transaction = await claimsRegistry.setClaim(
    project.ethAddresses['project'],
    claimKey,
    claimValue);

  return getTxHash(transaction);
};

EthProxy.fetchImpact = async (project, validationId) => {
  logger.info('Fetching impacts for: ' + validationId);
  let validationIdBytes = mongoIdToBytes(validationId);

  let impacts = [];
  let contracts = await ContractProxy.getAllContractsForDocument(project);

  return await new Promise(function(resolve, reject) {
    return contracts.impactRegistry.getImpactCount(validationIdBytes).then(function (result) {
      let count = result.toNumber();
      logger.info('Fetching impacts: ' + count);
      if (count == 0) {
        resolve(impacts);
      }
      for (let index = 0; index < count; index++) {
        contracts.impactRegistry.getImpactDonor(validationIdBytes, index).then(function (donor) {
          let impact = {donor: donor};
          contracts.impactRegistry.getImpactValue(validationIdBytes, donor).then(function (value) {
            impact.value = value.toNumber();
            impacts.push(impact);
            logger.info('Fetched impact for donor ' + impact.donor + ' of: ' + impact.value);
            if (impacts.length == count) {
              resolve(impacts);
            }
          });
        });
      }
    });
  });
};

EthProxy.getImpactLinked = async (project, validationId) => {
  let validationIdBytes = mongoIdToBytes(validationId);
  let contracts = await ContractProxy.getAllContractsForDocument(project);

  let result = await contracts.impactRegistry.getImpactLinked(validationIdBytes);
  return result.toNumber();
};

EthProxy.linkImpact = async (project, validationId) => {
  let validationIdBytes = mongoIdToBytes(validationId);

  logger.info('Linking impact: ' + validationId);
  let contracts = await ContractProxy.getAllContractsForDocument(project);

  let transaction = await contracts.impactRegistry.linkImpact(validationIdBytes);
  return getTxHash(transaction);
};

EthProxy.checkTransaction = async function (tx) {
  logger.info('Checking transaction: ' + tx);
  let provider = ContractUtils.mainWallet.provider;
  return await provider.getTransactionReceipt(tx);
};

EthProxy.checkTransactionReceipt = function (receipt) {
  return receipt.status == 1;
};

EthProxy.deployProject = async (project, validatorAccount, charityAccount) => {
  try {
    return await Deploy.deployProject(
      validatorAccount,
      charityAccount,
      config.claimsRegistryAddress,
      project);
  } catch (err) {
    logger.error(err);
    throw err;
  }
};

EthProxy.checkTransactionWithEtherscan = function (tx) {
  let etherscanUrl = '';
  switch (config.networkName) {
  case 'rinkeby':
    etherscanUrl = 'https://rinkeby.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=';
    break;
  case 'main':
    etherscanUrl = 'https://etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=';
    break;
  default:
    throw 'Cannot get etherscan url for network: ' + config.networkName;
  }

  return request(etherscanUrl + tx, function (error, response, body) {
    if (!error && response.statusCode == 200 && JSON.parse(body).result == null) {
      return false;
    }
    return true;
  });
};

function getTxHash(txResult) {
  return txResult.hash;
}

function mongoIdToBytes(id) {
  // return '0x' + web3.utils.padLeft(id.toString(), 64);
  return ethers.utils.hexZeroPad('0x' + id.toString(), 32);
}

function numberToBytes(number) {
  // return '0x' + web3.padLeft(web3.toHex(number).substr(2), 64);
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(number), 32);
}

module.exports = EthProxy;
