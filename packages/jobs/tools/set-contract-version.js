/*
 * Manually sets version of a deployed versioned contract in the DB.
 *
 * Example usage: node tools/set-contract-version.js 0x78d4... Project 2
 */

const argv = require('yargs').argv;
const mongoose = require('mongoose');

const config = require('../config');
const ModelUtils = require('../utils/model-utils');

const ContractVersion = ModelUtils.loadModel('contractVersion');
const DeployedContract = ModelUtils.loadModel('deployedContract');

async function main() {
  console.log(`Connecting to DB: ${config.db}`);
  mongoose.connect(config.db, {useNewUrlParser: true});

  let [address, contractName, version] = argv._;
  if (!address || !contractName || !version) {
    console.log('Usage: set-contract-version.js ADDRESS CONTRACT VERSION');
    process.exit(1);
  }
  version = +version;

  let contractVersion = await ContractVersion.findOne({
    contract: contractName,
    version: version,
  });

  if (!contractVersion) {
    console.error(
      `Error: couldn't find version "${version}" of contract ${contractName}`);
    process.exit(1);
  }

  await new DeployedContract({
    address: address,
    contract: contractName,
    version: version,
    abi: contractVersion.abi,
  }).save();

  console.log(`Set version of ${address} to ${contractName} v${version}`);
}

main().then(() => {
  console.log('Finished successfully');
}).catch(err => {
  console.error(`Error occured: ${err}`);
});
