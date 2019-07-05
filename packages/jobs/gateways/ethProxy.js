const Promise = require('bluebird');
const request = require('request');
const ethers = require('ethers');

const ContractUtils = require('../utils/contract-utils');
const ContractProxy = require('./contractProxy');
const Deploy = require('../utils/deploy');
const logger = require('../utils/logger')('gateways/ethProxy');
const config = require('../config');

let EthProxy = {};

EthProxy.getAddressForIndex = function (index) {
  return ContractUtils.getWalletForIndex(index).address;
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
  logger.info('Minting: ' + amount);
  let contracts = await ContractProxy.getAllContractsForDocument(project);
  return getTxHash(await contracts.token.mint(contracts.project.address, amount));
};

EthProxy.validateOutcome = async (
  project, validation, validatorAccount
) => {
  logger.info(
    `Validating outcome, validation id: ${validation._id}, ` +
    `amount: ${validation.amount}`);

  let validatorWallet = ContractUtils.getWallet(validatorAccount);

  let contracts = await ContractProxy.getAllContractsForDocument(
    project,
    validatorWallet);

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
  let beneficiaryWallet = ContractUtils.getWallet(beneficiary);

  let claimsRegistry = ContractUtils.getContractInstance(
    'ClaimsRegistry',
    project.ethAddresses['claimsRegistry'],
    beneficiaryWallet);

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
