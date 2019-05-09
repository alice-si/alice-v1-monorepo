/*
 * Common features for all contract proxies.
 */

const path = require('path');

const Promise = require('bluebird');
const contract = require('truffle-contract');
const json = require('@stratumn/canonicaljson');

const ContractUtils = require('../utils/contract-utils');
const ModelUtils = require('../utils/model-utils');

const ContractVersion = ModelUtils.loadModel('contractVersion');
const DeployedContract = ModelUtils.loadModel('deployedContract');

const CONTRACTS_DIR = '../build/contracts';

/**
 * Create a proxy truffle-contract like module for interacting
 * with contracts of different versions.
 */
function createProxy(contractName) {
  let web3 = ContractUtils.getWeb3();
  let contractJson = require(path.join(CONTRACTS_DIR, `${contractName}.json`));
  let CurrentContract = contract(contractJson);
  CurrentContract.setProvider(web3.currentProvider);

  return {
    new: async (...args) => {
      let currentAbi = json.stringify(contractJson.abi);
      let version = await ContractVersion.findOne({
        abi: currentAbi,
      });

      if (!version) {
        console.log(`WARNING: deploying ${contractName} with non-stable ABI! ` +
          'Don\'t do this in production!');
      }

      let instance = await CurrentContract.new(...args);

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

    at: async (address) => {
      let deployedContract =
        await DeployedContract.findOne({ address: address });

      let abi;
      if (deployedContract) {
        abi = json.parse(deployedContract.abi);
      } else {
        console.log('WARNING: accessing Project with non-stable ABI! ' +
          'Don\'t do this in production!');
        abi = CurrentContract.abi;
      }

      let web3Contract = web3.eth.contract(abi).at(address);

      // TODO move to web3 1.0 promievents and drop Bluebird.
      // TODO allow contract proxies to redefine contract methods
      //      for different contract versions.
      return Promise.promisifyAll(web3Contract);
    },
  };
}

module.exports = {
  createProxy,
};
