const JobUtils = require('../utils/job-utils');
const ModelUtils = require('../utils/model-utils');
const Donation = ModelUtils.loadModel('donation');
const EthProxy = require('../gateways/ethProxy');

const startStatus = 'MINTING_COMPLETED';

function mainAction(jobContext) {
  let donation = jobContext.model;
  var userAccount = donation._userId.ethAccount;
  if (!userAccount) {
    jobContext.msg('Missing user account for user: ' + JSON.stringify(donation._userId));
    return ModelUtils.changeStatus(donation, startStatus);
  }
  jobContext.msg('Executing donation: ' + JSON.stringify(donation));
  return EthProxy.deposit(userAccount, donation._projectId, donation.amount).then(function (tx) {
    jobContext.msg("Deposit was finished successfully " + JSON.stringify(tx));
    return jobContext.inProgressBehaviour(tx);
  }).catch(function (err) {
    return jobContext.errorBehaviour(err);
  });
}

module.exports = JobUtils.createJob({
  processName: 'DEPOSITING',
  createChecker: true,
  startStatus: startStatus,
  model: Donation,
  action: mainAction,
  completedStatus: 'DONATED'
});