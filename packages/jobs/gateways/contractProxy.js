/*
 * Common features for all contract proxies.
 */

const path = require('path');

const contract = require('truffle-contract');
const json = require('@stratumn/canonicaljson');
const ethers = require('ethers');

const ContractUtils = require('../utils/contract-utils');
const ModelUtils = require('../utils/model-utils');
const logger = require('../utils/logger')('gateways/contractProxy');
const config = require('../config');

const ContractVersion = ModelUtils.loadModel('contractVersion');
const DeployedContract = ModelUtils.loadModel('deployedContract');

const CONTRACTS_DIR = '../build/contracts';

/**
 * Create a proxy truffle-contract like module for interacting
 * with contracts of different versions.
 */
function getContract(contractName) {
  let contractJson = require(path.join(CONTRACTS_DIR, `${contractName}.json`));
  let CurrentContract = contract(contractJson);

  return {
    new: async (...args) => {
      let currentAbi = json.stringify(contractJson.abi);
      let version = await ContractVersion.findOne({
        abi: currentAbi,
      });

      if (!version) {
        logger.warn(`Deploying ${contractName} with non-stable ABI! ` +
          'Don\'t do this in production!');
      }

      let instance = await ContractUtils.deployContract(CurrentContract, ...args);

      if (version) {
        await new DeployedContract({
          address: instance.address,
          contract: contractName,
          version: version.version,
          abi: version.abi,
        }).save();
      }

      return instance;
    },

    at: async (address, wallet=ContractUtils.mainWallet) => {
      let deployedContract =
        await DeployedContract.findOne({ address: address });

      let abi;
      if (deployedContract) {
        abi = json.parse(deployedContract.abi);
      } else {
        logger.warn(`Accessing ${contractName} with non-stable ABI! ` +
          'Don\'t do this in production!');
        abi = CurrentContract.abi;
      }

      return new ethers.Contract(address, abi, wallet);
    },
  };
}

async function getAllContractsForDocument(
  project,
  addressForWallet
) {
  if (!addressForWallet) {
    addressForWallet = getAddress(project, 'owner');
  }

  const wallet = await ContractUtils.getWallet({
    address: addressForWallet,
    checkBalance: true
  });

  let Project = getContract('Project');
  let projectContract = await Project.at(
    getAddress(project, 'project'),
    wallet);
  
  let ImpactRegistry = getContract('ImpactRegistry');
  let impactRegistryContract = await ImpactRegistry.at(
    getAddress(project, 'impact'),
    wallet);

  let AliceToken = getContract('AliceToken');
  let tokenContract = await AliceToken.at(
    getAddress(project, 'token'),
    wallet);

  return {
    project: projectContract,
    token: tokenContract,
    impactRegistry: impactRegistryContract
  };
}

function getAddress(project, name) {
  if (project && project.ethAddresses && project.ethAddresses[name]) {
    return project.ethAddresses[name];
  } else {
    throw 'Project: ' + JSON.stringify(project) +
          ' doesn\'t have address for field: ' + name;
  }
}

module.exports = {
  getContract,
  getAllContractsForDocument,
};
