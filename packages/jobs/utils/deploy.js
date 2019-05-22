const ContractUtils = require('./contract-utils');
const logger = require('./logger')('utils/deploy');
const ImpactRegistry = require('../contract_proxies/ImpactRegistry');
const Linker = require('../contract_proxies/FlexibleImpactLinker');
const Project = require('../contract_proxies/Project');
const config = require('../config');

const AliceToken = ContractUtils.initializeContract('AliceToken');
const ClaimsRegistry = ContractUtils.initializeContract('ClaimsRegistry');

const web3 = ContractUtils.getWeb3();

async function deployToken(aliceAccount, contractAddresses) {
  let tokenContract = await AliceToken.new(getTxConfig(aliceAccount, 4e6));
  logger.info('Token deployed: ' + tokenContract.address);
  contractAddresses.token = tokenContract.address;
}

async function deployProject(
  aliceAccount,
  validatorAccount,
  beneficiaryAccount,
  project,
  contractAddresses
) {
	let projectContract = await Project.new(
    project.code, project.upfrontPayment, getTxConfig(aliceAccount, 5e6));
	logger.info('Project deployed: ' + projectContract.address);

	let setValidatorTx = await projectContract.setValidator(
    validatorAccount, getTxConfig(aliceAccount));
	logger.info('setValidator tx created: ' + setValidatorTx.tx);

	let setBeneficiaryTx = await projectContract.setBeneficiary(
    beneficiaryAccount, getTxConfig(aliceAccount));
  logger.info('setBeneficiary tx created: ' + setBeneficiaryTx.tx);

	let setTokenTx = await projectContract.setToken(
    contractAddresses.token, getTxConfig(aliceAccount));
  logger.info('setToken tx created: ' + setTokenTx.tx);

	let impactContract = await ImpactRegistry.new(
    projectContract.address, getTxConfig(aliceAccount, 4e6));
  logger.info('ImpactRegistry deployed: ' + impactContract.address);

	let linkerContract = await Linker.new(
    impactContract.address, 10, getTxConfig(aliceAccount, 4e6));
  logger.info('Linker deployed: ' + linkerContract.address);

	let setLinkerTx = await impactContract.setLinker(
    linkerContract.address, getTxConfig(aliceAccount));
  logger.info('setLinker tx created: ' + setLinkerTx.tx);

  let setImpactRegistryTx = await projectContract.setImpactRegistry(
    impactContract.address, getTxConfig(aliceAccount));
  logger.info('setImpactRegistry tx created: ' + setImpactRegistryTx.tx);

  if (contractAddresses.claimsRegistry) {
    let setClaimsRegistryTx = await projectContract.setClaimsRegistry(
      contractAddresses.claimsRegistry, getTxConfig(aliceAccount));
    logger.info('setClaimsRegistry tx created: ' + setClaimsRegistryTx.tx);
  } else {
    logger.info('Project deployed without ClaimsRegistry');
  }

  contractAddresses.project = projectContract.address;
  contractAddresses.impact = impactContract.address;
  contractAddresses.linker = linkerContract.address;

  return linkerContract; // return last transaction info to get txId for job checker
}

async function deploy(
  aliceAccount,
  validatorAccount,
  beneficiaryAccount,
  claimsRegistryAddress,
  project
) {
  logger.info('Deploying project with the following data: ' + JSON.stringify({
    AliceAccount: aliceAccount,
    ValidatorAccount: validatorAccount,
    BenficiaryAccount: beneficiaryAccount,
    ProjectName: project.code,
    ProjectUpfront: project.upfrontPayment
  }));
  let contractsAddresses = {
    claimsRegistry: claimsRegistryAddress,
  };

  await deployToken(aliceAccount, contractsAddresses);
  var lastTx = await deployProject(
    aliceAccount,
    validatorAccount,
    beneficiaryAccount,
    project,
    contractsAddresses);

  return Object.assign(contractsAddresses, {
    validator: validatorAccount,
    beneficiary: beneficiaryAccount,
    owner: aliceAccount,
    lastTx: lastTx.transactionHash
  });
}

function getTxConfig(account, gasLimit = 1e6) {
  return {
    from: account,
    gas: gasLimit,
    gasPrice: 10000000000 // 10 gwei
  }
}

module.exports = {};

module.exports.deployProject = async (
  aliceAccount,
  validatorAccount,
  beneficiaryAccount,
  claimsRegistryAddress,
  project,
  passwords
) => {
  if (!project.code || project.upfrontPayment < 0
        || project.upfrontPayment > 100) {
    throw 'Project is not valid';
  }

  if (passwords) {
    await web3.personal.unlockAccount(
      aliceAccount, passwords.owner, config.accountUnlockTtl);
  }
  var addresses = await deploy(
    aliceAccount,
    validatorAccount,
    beneficiaryAccount,
    claimsRegistryAddress,
    project);
  logger.info('Contracts were deployed: ' + JSON.stringify(addresses));

  return addresses;
};

module.exports.deployClaimsRegistry = async (aliceAccount, password) => {
  if (password) {
    await web3.personal.unlockAccount(
      aliceAccount, password, config.accountUnlockTtl);
  }

  let claimsRegistryContract = await ClaimsRegistry.new(getTxConfig(aliceAccount));
  logger.info('ClaimsRegistry deployed: ' + claimsRegistryContract.address);

  return claimsRegistryContract.address;
};
