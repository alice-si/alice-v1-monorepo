const contract = require('truffle-contract');
const ethers = require('ethers');

const config = require('../config');
const logger = require('./logger')('utils/contract-utils');

const contractsFolder = '../build/contracts/';
const MAX_ITERATIONS_FOR_WALLET_SEARCHING = 10000;
const LOG_INTERATIONS_INTERVAL = 1000;

let ContractUtils = {
  getProvider,
};

ContractUtils.mainWallet = getMainWallet();
validateNetworkId(ContractUtils.mainWallet.provider);

ContractUtils.getTruffleContract = function (name) {
  const artefacts = require(contractsFolder + name + '.json');
  return contract(artefacts);
};

ContractUtils.getContractInstance = function (
  contractName,
  address,
  wallet=ContractUtils.mainWallet
) {
  const contract = ContractUtils.getTruffleContract(contractName);
  return new ethers.Contract(address, contract.abi, wallet);
};

ContractUtils.getWalletForIndex = function (index) {
  let path = `m/44'/60'/0'/0/${index}`;
  return new ethers.Wallet.fromMnemonic(config.mnemonic, path);
};

ContractUtils.getWallet = function (address) {
  for (let counter = 0; counter < MAX_ITERATIONS_FOR_WALLET_SEARCHING; counter++) {
    if (counter > 0 && counter % LOG_INTERATIONS_INTERVAL == 0) {
      logger.info(`${counter} wallets checked, but address ${address} still was not found`);
    }
    let wallet = ContractUtils.getWalletForIndex(counter);
    if (equalAddresses(wallet.address, address)) {
      const provider = getProvider();
      return wallet.connect(provider);
    }
  }
  throw new Error(`Could not get wallet for address: ${address}`);
};

ContractUtils.deployContract = async function (truffleContractObj, ...args) {
  const { abi, bytecode } = truffleContractObj;
  const contractFactory = new ethers.ContractFactory(
    abi,
    bytecode,
    ContractUtils.mainWallet);
  const contract = await contractFactory.deploy(...args);
  await contract.deployed(); // waiting until it is mined
  return contract;
};

function getProvider() {
  return new ethers.providers.JsonRpcProvider(config.ethClientAddress);
};

function getMainWallet() {
  const provider = getProvider();
  const mainWallet = ethers.Wallet.fromMnemonic(config.mnemonic);
  return mainWallet.connect(provider);
}

function equalAddresses(addr1, addr2) {
  return addr1.toLowerCase() == addr2.toLowerCase();
}

async function validateNetworkId(provider) {
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

  const network = await provider.getNetwork();
  if (network.chainId !== networkId) {
    logger.error(`Network id = ${network.chainId}, expected by config: ${networkId}`);
  }
}

module.exports = ContractUtils;
