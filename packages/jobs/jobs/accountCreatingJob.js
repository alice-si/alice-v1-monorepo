const JobUtils = require('../utils/job-utils');
const ModelUtils = require('../utils/model-utils');
const User = ModelUtils.loadModel('user');
const KeyProxy = require('../gateways/keyProxy');
const EthProxy = require('../gateways/ethProxy');

async function mainAction(jobContext) {
  let user = jobContext.model;
  jobContext.msg('Found user without account: ' + user._id + ' ( ' + user.email + ' )');
  const password = KeyProxy.decrypt(user.crypto);
  const address = await EthProxy.createAccount(password);
  jobContext.msg('Created account with address: ' + address);
  //user.crypto = null;
  user.ethAccount = address;
  return await user.save();
}

module.exports = JobUtils.createJob({
  processName: 'ACCOUNT_CREATING',
  createChecker: false,
  modelGetter: (() => User.findOne({ethAccount: null, crypto: {$exists: true}})),
  action: mainAction
});