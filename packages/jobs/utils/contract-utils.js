const contract = require('truffle-contract');
const ethers = require('ethers');
const config = require('../config');
const logger = require('./logger')('utils/contract-utils');
const keyProxy = require('../gateways/keyProxy');
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
  const overrides = {
    gasLimit: 3000000,
    gasPrice: 15000000000 // 15 gwei
  };
  const contract = await contractFactory.deploy(...args);
  logger.debug('Contract deployment started: '
    + JSON.stringify(contract.deployTransaction.hash));
  await contract.deployed(); // waiting until it is mined
  logger.debug('Contract deployment finished: '
    + JSON.stringify(contract.deployTransaction.hash));
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
  let wallet = await getWallet({
    address: addressForWallet,
    checkBalance: true
  });
  
  return new ethers.Contract(address, contract.abi, wallet);
}

async function getWallet({
  address,
  checkBalance=false,
}) {
  if (equalAddresses(address, config.mainAccount)) {
    return mainWallet;
  }

  let ethAddress = await EthAddress.findOne({
    address: { $regex : new RegExp(address, "i") }
  });
  if (!ethAddress) {
    throw new Error(`Could not get wallet for address: ${address}`);
  }

  let wallet;

  if (ethAddress.index) {
    wallet = getWalletForIndex(ethAddress.index);
  } else {
    const privateKey = keyProxy.decrypt(ethAddress.privateKey);
    wallet = getWalletFromPrivateKey(privateKey);
  }

  // Generated address must be equal to the address argument
  if (!equalAddresses(address, wallet.address)) {
    throw new Error(`Wallet generating failed. `
      + `Addresses are different: ${address}, ${wallet.address}`);
  }

  if (checkBalance) {
    await checkWalletBalance(wallet);
  }

  return wallet;
}

function getMainWallet() {
  return getWalletForIndex(0);
}

function initWallet(wallet) {
  let provider = getProvider();
  wallet = wallet.connect(provider);
  return wallet.setAutoNonce(config.enableAutoNonce);
}

function getWalletForIndex(index) {
  let path = `m/44'/60'/0'/0/${index}`;
  let mnemonicWallet = ethers.Wallet.fromMnemonic(config.mnemonic, path);
  return initWallet(mnemonicWallet);
}

function getWalletFromPrivateKey(privateKey) {
  let walletFromPrivateKey = new ethers.Wallet(privateKey);
  return initWallet(walletFromPrivateKey);
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

async function checkWalletBalance(wallet) {
  let balance = await wallet.provider.getBalance(wallet.address);
  minimalBalanceBN = ethers.utils.parseEther(config.minimalBalance);
  if (balance.lt(minimalBalanceBN)) {
    let amountToSend = ethers.utils.parseEther(config.defaultLoadAmount);
    logger.info(`Loading wallet: ${wallet.address}`);
    await loadWallet(wallet, amountToSend);
  }
}

async function loadWallet(wallet, amount) {
  await mainWallet.sendTransaction({
    to: wallet.address,
    value: amount
  });
}

module.exports = {
  getProvider,
  getWallet,
  getWalletForIndex,
  getWalletFromPrivateKey,
  getContractInstance,
  deployContract,
  mainWallet,
};
