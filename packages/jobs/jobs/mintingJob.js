const JobUtils = require('../utils/job-utils');
const ModelUtils = require('../utils/model-utils');
const Donation = ModelUtils.loadModel('donation');
const EthProxy = require('../gateways/ethProxy');

function mainAction(jobContext) {
  let donation = jobContext.model;
  return EthProxy.mint(donation._projectId, donation.amount).then(function (tx) {
    jobContext.msg('Minting was finished successfully ' + JSON.stringify(tx));
    return jobContext.inProgressBehaviour(tx);
  }).catch(function (err) {
    return jobContext.errorBehaviour(err);
  });
}

module.exports = JobUtils.createJob({
  processName: 'MINTING',
  createChecker: true,
  startStatus: 'COLLECTING_COMPLETED',
  model: Donation,
  action: mainAction
});