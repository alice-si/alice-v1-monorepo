/**
 * Deploys ClaimsRegistry contract to the current network.
 */

const argv = require('yargs').argv;

const Deploy = require('../utils/deploy');
const config = require('../config');

Deploy.deployClaimsRegistry(config.mainAccount || argv.account,
  config.mainPassword || argv.password);
