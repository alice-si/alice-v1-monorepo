const JobUtils = require('../utils/job-utils');
const ModelUtils = require('../utils/model-utils');
const Validation = ModelUtils.loadModel('validation');
const Project = ModelUtils.loadModel('project');
const User = ModelUtils.loadModel('user');
const Impact = ModelUtils.loadModel('impact');
const MailUtils = require('../utils/mail-utils');
const EthProxy = require('../gateways/ethProxy');
const Promise = require('bluebird');

// TODO refactor it using new Job class mechanism

function mainAction(jobContext) {
  let lastUser, lastImpact;
  let validation = jobContext.model;
  let project = validation._projectId;
  jobContext.msg('Fetching impact for validation: ' + validation._id);
  return EthProxy.fetchImpact(project, validation._id.toString()).then(function (impacts) {
    return Promise.map(impacts, function (impact) {
      return User.findOne({ethAccount: impact.donor}).then(function (user) {
        if (!user) {
          throw 'There are no users with ethAccount: ' + impact.donor;
        }
        lastUser = user;
        return new Impact({
          _projectId: project._id,
          _outcomeId: validation._outcomeId,
          _userId: user._id,
          _validationId: validation._id,
          amount: impact.value
        }).save();
      }).then(function (impact) {
        jobContext.msg('Impact fetched for validation: ' + validation._id, ' impactID: ' + impact._id);
        lastImpact = impact;
        return Project.findById(project._id).populate('charity');
      }).then(function (projectWithCharity) {
        return MailUtils.sendImpactConfirmation(lastUser, projectWithCharity, lastImpact);
      });
    }).then(function () {
      return jobContext.completedBehaviour();
    });
  }).catch(function (err) {
    return jobContext.errorBehaviour(err);
  });
}

module.exports = JobUtils.createJob({
  processName: 'IMPACT_FETCHING',
  createChecker: false,
  startStatus: 'LINKING_COMPLETED',
  model: Validation,
  action: mainAction,
});
