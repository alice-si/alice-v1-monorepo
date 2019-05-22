const Web3 = require('web3');
const Promise = require('bluebird');
const contract = require('truffle-contract');

const config = require('../config');
const logger = require('./logger')('utils/contract-utils');

let ContractUtils = {};

const contractsFolder = '../build/contracts/';
let web3 = null;

const AliceToken = initializeContract('AliceToken');
const ClaimsRegistry = initializeContract('ClaimsRegistry');

ContractUtils.getClaimsRegistry = (address) => {
  return getContractInstance(ClaimsRegistry, address);
};

ContractUtils.getProvider = function () {
  lazyInitWeb3();
  return web3.currentProvider;
};

ContractUtils.getWeb3 = function () {
  lazyInitWeb3();
  validateNetworkId();
  return web3;
};

Object.assign(ContractUtils, {
  AliceToken,

  getContractInstance,
  initializeContract,
});

function getContractInstance (contract, address) {
  let contractByAbi = ContractUtils.getWeb3().eth.contract(contract.abi);
  let contractInstance = contractByAbi.at(address);
  return Promise.promisifyAll(contractInstance);
}

function lazyInitWeb3() {
  if (!web3) {
    web3 = new Web3(getDefaultProvider());
  }
}

function getDefaultProvider() {
  return new Web3.providers.HttpProvider(config.ethClientAddress);
}

function validateNetworkId() {
  let networkId;
  switch (config.networkName) {
  case 'local':
    networkId = 3;
    break;
  case 'rinkeby':
    networkId = 4;
    break;
  case 'main':
    networkId = 1;
    break;
  default:
    throw 'network name is unknown: ' + config.networkName;
  }
  web3.version.getNetwork(function (err, netId) {
    // assert(!err, err);
    // assert(netId == networkId, 'Network id is incorrect');
    if (err) {
      logger.error(err);
    }
    if(netId != networkId) {
      const ids = '(config value: ' + networkId + ', real value: ' + netId + ')';
      logger.error('Network id is incorrect ' + ids);
    }
  });
}

function initializeContract(contractName) {
  lazyInitWeb3();
  const artefacts = require(contractsFolder + contractName + '.json');
  let contractObj = contract(artefacts);
  contractObj.setProvider(web3.currentProvider);

  return contractObj;
}

module.exports = ContractUtils;
