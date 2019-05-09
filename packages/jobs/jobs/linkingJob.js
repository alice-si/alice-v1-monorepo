const JobUtils = require('../utils/job-utils');
const ModelUtils = require('../utils/model-utils');
const Validation = ModelUtils.loadModel('validation');
const EthProxy = require('../gateways/ethProxy');

function mainAction(jobContext) {
  let validation = jobContext.model;
  jobContext.msg('Linking impact for validation: ' + validation._id);
  let project = validation._projectId;
  return EthProxy.getImpactLinked(project, validation._id.toString())
    .then(function (linkedAmount) {
      jobContext.msg('Currently linked: ' + linkedAmount + ' of: ' + validation.amount);
      if (linkedAmount == validation.amount) {
        jobContext.msg('All impact linked for validation: ' + validation._id);
        return ModelUtils.changeStatus(validation, 'LINKING_COMPLETED');
      } else {
        EthProxy.linkImpact(project, validation._id.toString()).then(function (linkingTx) {
          validation.linkingTransactions.push(linkingTx);
          return validation.save().then(function () {
            return jobContext.inProgressBehaviour(linkingTx);
          });
        });
      }
    }).catch(function (err) {
      return jobContext.errorBehaviour(err);
    });
}

module.exports = JobUtils.createJob({
  processName: 'LINKING',
  createChecker: true,
  modelGetter: function () {
    return Validation.findOneAndUpdate({
      status: ['VALIDATING_COMPLETED', 'LINKING_STEP_COMPLETED']
    }, {
      status: 'LINKING_STARTED',
    }).populate('_projectId');
  },
  completedStatus: 'LINKING_STEP_COMPLETED',
  model: Validation,
  action: mainAction
});
