/*
 * Adds a new version of an upgradable contract to the database.
 * Note that this has to be done once for every environment for
 * consistency.
 *
 * Example usage: node tools/upgrade-contract.js Project
 */

const path = require('path');

const argv = require('yargs').argv;
const mongoose = require('mongoose');
const json = require('@stratumn/canonicaljson');

const config = require('../config');
const ModelUtils = require('../utils/model-utils');

const ContractVersion = ModelUtils.loadModel('contractVersion');

const CONTRACTS_DIR = '../build/contracts/';

async function main() {
  console.log(`Connecting to DB: ${config.db}`);
  mongoose.connect(config.db, {useNewUrlParser: true});

  let contractName = argv._[0];
  if (!contractName) {
    console.log('Usage: upgrade-contract.js CONTRACT');
    process.exit(1);
  }

  let contractJson = require(path.join(CONTRACTS_DIR, `${contractName}.json`));
  let contractAbi = json.stringify(contractJson.abi);

  let duplicateVersion = await ContractVersion.findOne({
    abi: contractAbi
  });
  if (duplicateVersion) {
    console.error(
      'Error: a version with the same ABI is already present: ' +
      `v${duplicateVersion.version}`);
    process.exit(1);
  }

  let latestVersion =
    await ContractVersion.findOne({ contract: contractName }).sort('-version');
  if (latestVersion) {
    nextVersion = latestVersion.version + 1;
  } else {
    nextVersion = 1;
  }

  await new ContractVersion({
    contract: contractName,
    version: nextVersion,
    abi: contractAbi
  }).save();

  console.log(`Registered new version v${nextVersion}`);
}

function firstLetterToLowerCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

main().then(() => {
  console.log('Finished successfully');
}).catch(err => {
  console.error(`Error occured: ${err}`);
});
