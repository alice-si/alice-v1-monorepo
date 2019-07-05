const ContractUtils = require('./contract-utils');
const logger = require('./logger')('utils/deploy');
const config = require('../config');
const { getContract } = require('../gateways/contractProxy');

const Project = getContract('Project');
const Linker = getContract('FlexibleImpactLinker');
const ImpactRegistry = getContract('ImpactRegistry');
const AliceToken = getContract('AliceToken');
const ClaimsRegistry = getContract('ClaimsRegistry');

const wallet = ContractUtils.mainWallet;
const provider = wallet.provider;

async function deployToken(contractsAddresses) {
  const tokenContract = await AliceToken.new();
  logger.info('Token deployed: ' + tokenContract.address);
  contractsAddresses.token = tokenContract.address;
}

async function waitForTx(tx) {
  await provider.waitForTransaction(tx.hash);
  logger.info('Transaction finished: ' + tx.hash);
}

async function deployProject(
  validatorAccount,
  beneficiaryAccount,
  project,
  contractAddresses
) {
  let projectContract = await Project.new(project.code, project.upfrontPayment);
  logger.info('Project deployed: ' + projectContract.address);

  let setValidatorTx = await projectContract.setValidator(validatorAccount);
  logger.info('setValidator tx created: ' + setValidatorTx.hash);
  await waitForTx(setValidatorTx);

  let setBeneficiaryTx = await projectContract.setBeneficiary(beneficiaryAccount);
  logger.info('setBeneficiary tx created: ' + setBeneficiaryTx.hash);
  await waitForTx(setBeneficiaryTx);

  let setTokenTx = await projectContract.setToken(contractAddresses.token);
  logger.info('setToken tx created: ' + setTokenTx.hash);
  await waitForTx(setTokenTx);

  let impactContract = await ImpactRegistry.new(projectContract.address);
  logger.info('ImpactRegistry deployed: ' + impactContract.address);

  let linkerContract = await Linker.new(impactContract.address, 10);
  logger.info('Linker deployed: ' + linkerContract.address);

  let setLinkerTx = await impactContract.setLinker(linkerContract.address);
  logger.info('setLinker tx created: ' + setLinkerTx.hash);
  await waitForTx(setLinkerTx);

  let setImpactRegistryTx = await projectContract.setImpactRegistry(impactContract.address);
  logger.info('setImpactRegistry tx created: ' + setImpactRegistryTx.hash);
  await waitForTx(setImpactRegistryTx);

  if (contractAddresses.claimsRegistry) {
    let setClaimsRegistryTx = await projectContract.setClaimsRegistry(
      contractAddresses.claimsRegistry);
    logger.info('setClaimsRegistry tx created: ' + setClaimsRegistryTx.hash);
    await waitForTx(setClaimsRegistryTx);
  } else {
    logger.info('Project deployed without ClaimsRegistry');
  }

  contractAddresses.project = projectContract.address;
  contractAddresses.impact = impactContract.address;
  contractAddresses.linker = linkerContract.address;

  return linkerContract; // return last transaction info to get txId for job checker
}

async function deploy(
  validatorAccount,
  beneficiaryAccount,
  claimsRegistryAddress,
  project
) {
  logger.info('Deploying project with the following data: ' + JSON.stringify({
    ValidatorAccount: validatorAccount,
    BenficiaryAccount: beneficiaryAccount,
    ProjectName: project.code,
    ProjectUpfront: project.upfrontPayment
  }));
  let contractsAddresses = {
    claimsRegistry: claimsRegistryAddress,
  };

  await deployToken(contractsAddresses);

  var lastTx = await deployProject(
    validatorAccount,
    beneficiaryAccount,
    project,
    contractsAddresses);

  return Object.assign(contractsAddresses, {
    owner: config.mainAccount,
    validator: validatorAccount,
    beneficiary: beneficiaryAccount,
    lastTx: lastTx.transactionHash
  });
}

module.exports = {};

module.exports.deployProject = async (
  validatorAccount,
  beneficiaryAccount,
  claimsRegistryAddress,
  project,
) => {
  if (!project.code || project.upfrontPayment < 0
        || project.upfrontPayment > 100) {
    throw 'Project is not valid';
  }

  var addresses = await deploy(
    validatorAccount,
    beneficiaryAccount,
    claimsRegistryAddress,
    project);
  logger.info('Contracts were deployed: ' + JSON.stringify(addresses));

  return addresses;
};

module.exports.deployClaimsRegistry = async () => {
  let claimsRegistryContract = await ClaimsRegistry.new();
  logger.info('ClaimsRegistry deployed: ' + claimsRegistryContract.address);

  return claimsRegistryContract.address;
};
