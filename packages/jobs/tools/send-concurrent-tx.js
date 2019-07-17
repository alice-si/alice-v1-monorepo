// Use this script to test concurrent minting transactions
// It was created in order to fix the "replacement fee too low" ethers.js bug

// Before running set in .envrc
// - ETH_ENDPOINT_URL (to infura link) 
// - ETH_NETWORK_NAME (to rinkeby)
// - DB_URL (to stage db url)

// USAGE: source .envrc && node tools/send-concurrent-tx.js

const config = require('../config');
const mongoose = require('mongoose');
const EthProxy = require('../gateways/ethProxy');


run();

async function run() {
  await mongoose.connect(config.db);

  // Copied from stage DB greatest-need project
  let project = {
    ethAddresses: {
      claimsRegistry: "0x226B638D19eBA95998D30eF31Cb0CCD0d7f7b7F0",
      token: "0xEa77c55C26B5e77cd244a2D334e88876712AE871",
      project: "0xc7305b73c58dC702B0DEfFaC0a5363c304Ca1855",
      impact:"0xf60c0948CBfF825FBAba39a504705FFEe191FBFF",
      linker:"0x4a24fB6b38892bFf11AAbC097857B703C820BC4b",
      owner:"0x93e8f1811a8580649ad83778cf182709576f41b2",
      validator:"0x69d7595b20a55C6BA442777Fcf133853C8Dbb867",
      beneficiary:"0x875f7427343F64E36cA0c41C6B41Eb15BCC4dC7f",
    }
  }

  let result = await Promise.all([
    EthProxy.mint(project, 100),
    EthProxy.mint(project, 150)]);

  console.log(result);
  console.log('Done');
}

