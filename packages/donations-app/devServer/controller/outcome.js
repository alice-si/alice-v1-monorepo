
const asyncHandler = require('express-async-handler');

const Auth = require('../service/auth');
const AccessControl = require('../service/access-control');
const Utils = require('../service/utils');

const Outcome = Utils.loadModel('outcome');
const Project = Utils.loadModel('project');
const Validation = Utils.loadModel('validation');

module.exports = function (app) {
  // Returns a summary for all projects that the user is a validator of.
  app.get(
    '/api/getOutcomes/:projectCode',
    asyncHandler(async (req, res) => {
      let code = req.params.projectCode;
      let project = await Project.findOne({ code }).populate('_outcomes');
      if (!project) {
        return res.status(404).json(`No project with the code: '${code}'`);
      }

      let completedValidations = await Validation.find({
        _projectId: project._id,
        status: 'IMPACT_FETCHING_COMPLETED',
      });
      let outcomes = [];
      for (let _outcome of project._outcomes) {
        let outcome = _outcome.toObject();
        let helped = countValidationsForOutcome(outcome, completedValidations);
        outcome.helped = helped;
        outcomes.push(outcome);
      }

      return res.json({
        outcomes,
        projectUnit: project.typeOfBeneficiary,
      });
  }));

  app.get(
    '/api/getUserMoneyUsageForOutcomes/:projectCode',
    asyncHandler(async (req, res) => {
      // TODO implement
  }));

};

function countValidationsForOutcome(outcome, completedValidations) {
  return completedValidations.reduce((acc, validation) => {
    if (validation._outcomeId.equals(outcome._id)) {
      return acc + 1;
    }
    return acc;
  }, 0);
}
