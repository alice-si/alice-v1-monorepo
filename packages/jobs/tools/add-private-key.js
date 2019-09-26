/*
 * Manually adds ethAddress with encrypted privateKey to DB.
 *
 * Example usage: node tools/add-private-key.js 0x78d4...
 */

const argv = require('yargs').argv;
const mongoose = require('mongoose');
const ethers = require('ethers');

const config = require('../config');
const KeyProxy = require('../gateways/keyProxy');
const ModelUtils = require('../utils/model-utils');

const EthAddress = ModelUtils.loadModel('ethAddress');

async function main() {
  console.log(`Connecting to DB: ${config.db}`);
  await mongoose.connect(config.db, {useNewUrlParser: true});

  let [privateKey] = argv._;
  if (!privateKey) {
    console.log('Usage: node tools/add-private-key.js PRIVATE_KEY');
    process.exit(1);
  }

  let wallet = new ethers.Wallet(privateKey);
  let address = wallet.address;
  let privateKeyEncrypted = KeyProxy.encrypt(privateKey);

  let foundAddress = await EthAddress.findOne({
    'address': { $regex : new RegExp(address, "i") }
  });
  if (foundAddress) {
    console.log(`Adress: ${address} already exists in DB. Skipping.`);
  } else {
    let savedEthAddress = await new EthAddress({
      address,
      privateKey: privateKeyEncrypted
    }).save();
    console.log(`EthAddress added to db: ${JSON.stringify(savedEthAddress)}`);
  }  
}

main().then(() => {
  console.log('Finished successfully');
  process.exit();
}).catch(err => {
  console.error(`Error occured: ${err}`);
  process.exit();
});