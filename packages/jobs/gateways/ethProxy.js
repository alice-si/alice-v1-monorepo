const Promise = require('bluebird');
const request = require('request');

const ContractUtils = require('../utils/contract-utils');
const Deploy = require('../utils/deploy');
const Project = require('../contract_proxies/Project');
const logger = require('../utils/logger')('gateways/ethProxy');
const config = require('../config');

const web3 = ContractUtils.getWeb3();

let loadAmount = 0.1;

let EthProxy = {};

let createAccountAsync = Promise.promisify(web3.personal.newAccount);
let unlockAccountAsync = Promise.promisify(web3.personal.unlockAccount);
let sendAsync = Promise.promisify(web3.eth.sendTransaction);
let getReceiptAsync = Promise.promisify(web3.eth.getTransactionReceipt);

// setting mainAccount and mainPassword
const mainAccount = config.mainAccount;
const mainPassword = config.mainPassword;

EthProxy.loadAccount = function (fromAddress) {
  logger.info('Unlocking main account');
  return unlockAccountAsync(mainAccount, mainPassword).then(function () {
    logger.info('Preparing load transaction...');
    return sendAsync({from: mainAccount, to: fromAddress, value: web3.toWei(loadAmount, 'ether')});
  });
};

EthProxy.createAccount = function (password) {
  logger.info('Creating Geth Account...');
  return createAccountAsync(password);
};

// TODO
// EthProxy.donate = function (id, fromUserAccount, toContractAddress, amount) {
//   // return unlockAccountAsync(fromUserAccount, secret).then(function(){
//   //   console.log("Sending donation from: " + fromUserAccount);
//   //   return donateAsync(amount, id, {from: fromUserAccount});
//   // });
// };

EthProxy.deposit = async (fromUserAccount, project, amount) => {
  await unlockAccountAsync(mainAccount, mainPassword);

  let contracts = await Project.getAllContractsForDocument(project);
  logger.info('Depositing: ' + JSON.stringify({
    from: fromUserAccount,
    to: contracts.project.address,
    amount: amount
  }));
  return contracts.project.notifyAsync(
    fromUserAccount, amount, {from: mainAccount, gas: 1000000});
};

// TODO currently it is unused
// const Dai = ContractUtils.initializeContract('ERC20');
// current mechanism for skipping visited events, it could be optimised in the future
// let eventsFilterFromBlock = 0;
// EthProxy.getDaiDonations = function (projectCode) {
//   let dai = Dai.at(getDaiAddress());
//   result = [];
//   return new Promise(function(resolve, reject) {
//     let projectAddress;
//     try {
//       projectAddress = getProjectAddress(projectCode);
//     }
//     catch(err) {
//       //Ugly workaround
//       //TODO:  - we should keep project contract address in db, not a separate config
//       resolve(result);
//     }
//     console.log("Checking transfers for dai: " + getDaiAddress() + " and project: " + projectAddress);
//     dai.Transfer({to: projectAddress}, {
//       fromBlock: eventsFilterFromBlock,
//       toBlock: 'latest'
//     }).get(function (err, events) {
//       if (err) return reject(err);
//       events.forEach(function (event) {
//         result.push({
//           daiAddress: event.address,
//           daiTx: event.transactionHash,
//           daiValue: web3.fromWei(event.args.value, 'ether')
//         });
//         eventsFilterFromBlock = event.blockNumber+1;
//       });

//       return resolve(result);
//     });
//   });
// };

// TODO this function should be fixed
// EthProxy.payOutDai = function (project, toAddress, value) {
//   const daiAddress = getDaiAddress();
//   const weiValue = web3.toWei(value, 'ether');

//   return unlockAccountAsync(mainAccount, mainPassword).then(function () {
//     let projectContract = ContractUtils.getProjectContract(project);
//     return projectContract.reclaimAlternativeTokensAsync(daiAddress, toAddress, weiValue, {from: mainAccount});
//   });
// };

EthProxy.mint = async (project, amount) => {
  await unlockAccountAsync(mainAccount, mainPassword);

  logger.info('Minting: ' + amount);
  let contracts = await Project.getAllContractsForDocument(project);
  return contracts.token.mintAsync(
    contracts.project.address, amount, {from: mainAccount});
};

EthProxy.validateOutcome = async (
  project, validation, validatorAccount, validatorPass
) => {
  logger.info(
    `Unlocking validator account: ${validatorAccount}`);
  await unlockAccountAsync(validatorAccount, validatorPass);
  logger.info(
    `Validating outcome, validation id: ${validation._id}, ` +
    `amount: ${validation.amount}`);

  let contracts = await Project.getAllContractsForDocument(project);

  let idBytes = mongoIdToBytes(validation._id);
  let transaction = await contracts.project.validateOutcome(
    idBytes, validation.amount, { from: validatorAccount, gas: 3e6 });

  return transaction;
};

EthProxy.claimOutcome = async (project, validation, beneficiaryPass) => {
  let beneficiary = project.ethAddresses['beneficiary'];
  await unlockAccountAsync(beneficiary, beneficiaryPass);
  logger.info(
    `Claiming outcome, validation id: ${validation._id}, ` +
    `amount: ${validation.amount}`);

  let claimsRegistry = ContractUtils.getClaimsRegistry(
    project.ethAddresses['claimsRegistry']);

  let claimKey = mongoIdToBytes(validation._id);
  let claimValue = numberToBytes(validation.amount);
  let transaction = await claimsRegistry.setClaim(
    project.ethAddresses['project'],
    claimKey,
    claimValue,
    { from: beneficiary, gas: 3e6 });

  return transaction;
};

EthProxy.fetchImpact = async (project, validationId) => {
  logger.info('Fetching impacts for: ' + validationId);
  let validationIdBytes = mongoIdToBytes(validationId);

  let impacts = [];
  let contracts = await Project.getAllContractsForDocument(project);

  return await new Promise(function(resolve, reject) {
    return contracts.impactRegistry.getImpactCountAsync(validationIdBytes).then(function (result) {
      let count = result.toNumber();
      logger.info('Fetching impacts: ' + count);
      if (count == 0) {
        resolve(impacts);
      }
      for (let index = 0; index < count; index++) {
        contracts.impactRegistry.getImpactDonorAsync(validationIdBytes, index).then(function (donor) {
          let impact = {donor: donor};
          contracts.impactRegistry.getImpactValueAsync(validationIdBytes, donor).then(function (value) {
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
  let contracts = await Project.getAllContractsForDocument(project);

  let result = await contracts.impactRegistry.getImpactLinkedAsync(validationIdBytes);
  return result.toNumber();
};

EthProxy.linkImpact = async (project, validationId) => {
  await unlockAccountAsync(mainAccount, mainPassword);
  let validationIdBytes = mongoIdToBytes(validationId);

  logger.info('Linking impact: ' + validationId);
  let contracts = await Project.getAllContractsForDocument(project);
  return contracts.impactRegistry.linkImpactAsync(
    validationIdBytes, {from: mainAccount, gas: 500000});
};

EthProxy.checkTransaction = function (tx) {
  logger.info('Checking transaction: ' + tx);
  return getReceiptAsync(tx);
};

EthProxy.checkTransactionReceipt = function (receipt) {
  return receipt.status == 1;
};

EthProxy.deployProject = async (project, validatorAccount, charityAccount) => {
  try {
    return await Deploy.deployProject(
      mainAccount,
      validatorAccount,
      charityAccount,
      config.claimsRegistryAddress,
      project,
      { owner: mainPassword });
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

function mongoIdToBytes(id) {
  return '0x' + web3.padLeft(id.toString(), 64);
}

function numberToBytes(number) {
  return '0x' + web3.padLeft(web3.toHex(number).substr(2), 64);
}

module.exports = EthProxy;
