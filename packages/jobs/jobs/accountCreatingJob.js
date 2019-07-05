const JobUtils = require('../utils/job-utils');
const ModelUtils = require('../utils/model-utils');
const User = ModelUtils.loadModel('user');
const EthProxy = require('../gateways/ethProxy');

async function mainAction(jobContext) {
  let user = jobContext.model;
  jobContext.msg('Found user without account: ' + user._id + ' ( ' + user.email + ' )');

  const nextEthAddressIndex = 2;

  const address = EthProxy.getAddressForIndex(nextEthAddressIndex);

  jobContext.msg(`Created account with address: ${address} index: ${nextEthAddressIndex}`);

  user.ethAccount = address;
  user.ethAccountIndex = nextEthAddressIndex;

  return await user.save();
}

module.exports = JobUtils.createJob({
  processName: 'ACCOUNT_CREATING',
  createChecker: false,
  modelGetter: (() => User.findOne({ethAccount: null, crypto: {$exists: true}})),
  action: mainAction
});