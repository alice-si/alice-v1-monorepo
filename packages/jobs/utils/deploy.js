const ModelUtils = require('./model-utils');
const ContractUtils = require('./contract-utils');
const logger = require('./logger')('utils/deploy');
const config = require('../config');
const { getContract } = require('../gateways/contractProxy');

const ProjectModel = ModelUtils.loadModel('project');

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

async function updateContractAddressesForProject(ethAddresses, project) {
  await ProjectModel.findByIdAndUpdate(project._id, { ethAddresses });
  logger.debug('Contract addresses updated: ' + JSON.stringify(ethAddresses));
}

async function deployProject(
  validatorAccount,
  beneficiaryAccount,
  project,
  contractsAddresses
) {
  let projectContract;
  if (project.ethAddresses && project.ethAddresses.project) {
    projectContract = await Project.at(project.ethAddresses.project);
    contractsAddresses.project = project.ethAddresses.project;
    logger.info('Project deployment skipped (already deployed)');
  } else {
    projectContract = await Project.new(project.code, project.upfrontPayment);
    logger.info('Project deployed: ' + projectContract.address);
    contractsAddresses.project = projectContract.address;
    await updateContractAddressesForProject(contractsAddresses, project);
  }

  let setValidatorTx = await projectContract.setValidator(validatorAccount);
  logger.info('setValidator tx created: ' + setValidatorTx.hash);
  await waitForTx(setValidatorTx);

  let setBeneficiaryTx = await projectContract.setBeneficiary(beneficiaryAccount);
  logger.info('setBeneficiary tx created: ' + setBeneficiaryTx.hash);
  await waitForTx(setBeneficiaryTx);

  let setTokenTx = await projectContract.setToken(contractsAddresses.token);
  logger.info('setToken tx created: ' + setTokenTx.hash);
  await waitForTx(setTokenTx);

  let impactContract;
  if (project.ethAddresses && project.ethAddresses.impact) {
    impactContract = await ImpactRegistry.at(project.ethAddresses.impact);
    contractsAddresses.impact = project.ethAddresses.impact;
    logger.info('ImpactRegistry deployment skipped (already deployed)');
  } else {
    impactContract = await ImpactRegistry.new(projectContract.address);
    logger.info('ImpactRegistry deployed: ' + impactContract.address);
    contractsAddresses.impact = impactContract.address;
    await updateContractAddressesForProject(contractsAddresses, project);
  }

  let linkerContract;
  if (project.ethAddresses && project.ethAddresses.linker) {
    linkerContract = await Linker.at(project.ethAddresses.linker);
    contractsAddresses.linker = project.ethAddresses.linker;
    logger.info('Linker deployment skipped (already deployed)');
  } else {
    //Defaul value is 10GBP expressed in pennies (x100)
    linkerContract = await Linker.new(impactContract.address, 1000);
    logger.info('Linker deployed: ' + linkerContract.address);
    contractsAddresses.linker = linkerContract.address;
    await updateContractAddressesForProject(contractsAddresses, project);
  }

  let setLinkerTx = await impactContract.setLinker(linkerContract.address);
  logger.info('setLinker tx created: ' + setLinkerTx.hash);
  await waitForTx(setLinkerTx);

  let setImpactRegistryTx = await projectContract.setImpactRegistry(impactContract.address);
  logger.info('setImpactRegistry tx created: ' + setImpactRegistryTx.hash);
  await waitForTx(setImpactRegistryTx);

  if (contractsAddresses.claimsRegistry) {
    let setClaimsRegistryTx = await projectContract.setClaimsRegistry(
      contractsAddresses.claimsRegistry);
    logger.info('setClaimsRegistry tx created: ' + setClaimsRegistryTx.hash);
    await waitForTx(setClaimsRegistryTx);
  } else {
    logger.info('Project deployed without ClaimsRegistry');
  }

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
    owner: ContractUtils.mainWallet.address,
    validator: validatorAccount,
    beneficiary: beneficiaryAccount
  };

  if (project.ethAddresses && project.ethAddresses.token) {
    logger.info('Token deployment skipped (already deployed)');
    contractsAddresses.token = project.ethAddresses.token;
  } else {
    await deployToken(contractsAddresses);
    await updateContractAddressesForProject(contractsAddresses, project);
  }

  await deployProject(
    validatorAccount,
    beneficiaryAccount,
    project,
    contractsAddresses);
  await updateContractAddressesForProject(contractsAddresses, project);

  return contractsAddresses;
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
