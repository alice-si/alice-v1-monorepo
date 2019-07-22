const contract = require('truffle-contract');
const ethers = require('ethers');
const config = require('../config');
const logger = require('./logger')('utils/contract-utils');
const ModelUtils = require('../utils/model-utils');

const EthAddress = ModelUtils.loadModel('ethAddress');

const contractsFolder = '../build/contracts/';

const mainWallet = getMainWallet();
validateNetworkId(mainWallet.provider);

async function deployContract(truffleContractObj, ...args) {
  const { abi, bytecode } = truffleContractObj;
  const contractFactory = new ethers.ContractFactory(
    abi,
    bytecode,
    mainWallet);
  const contract = await contractFactory.deploy(...args);
  await contract.deployed(); // waiting until it is mined
  return contract;
};

function getProvider() {
  return new ethers.providers.JsonRpcProvider(config.ethEndpointUrl);
};

function getTruffleContract(name) {
  const artefacts = require(contractsFolder + name + '.json');
  return contract(artefacts);
}

async function getContractInstance(
  contractName,
  address,
  addressForWallet=config.mainAccount
) {
  const contract = getTruffleContract(contractName);
  let wallet = await getWallet(addressForWallet);
  
  return new ethers.Contract(address, contract.abi, wallet);
}

async function getWallet(address) {
  if (equalAddresses(address, config.mainAccount)) {
    return mainWallet;
  }

  let ethAddress = await EthAddress.findOne({
    address: { $regex : new RegExp(address, "i") }
  });
  if (!ethAddress) {
    throw new Error(`Could not get wallet for address: ${address}`);
  }
  
  return getWalletForIndex(ethAddress.index);
}

function getMainWallet() {
  return getWalletForIndex(0);
}

function getWalletForIndex(index) {
  let path = `m/44'/60'/0'/0/${index}`;
  let mnemonicWallet = ethers.Wallet.fromMnemonic(config.mnemonic, path);
  let provider = getProvider();
  return mnemonicWallet.connect(provider);
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
    logger.error(`Network id = ${network.chainId}`
      + ` expected by config: ${networkId}`);
  }
}

module.exports = {
  getProvider,
  getWallet,
  getWalletForIndex,
  getContractInstance,
  deployContract,
  mainWallet,
};
