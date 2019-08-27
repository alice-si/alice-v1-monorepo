
const asyncHandler = require('express-async-handler');

const Auth = require('../service/auth');
const AccessControl = require('../service/access-control');
const Utils = require('../service/utils');

const Impact = Utils.loadModel('impact');
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
    '/api/getImpactForOutcomes/:projectCode',
    Auth.auth(),
    asyncHandler(async (req, res) => {
      let outcomes = await Impact.aggregate([
        {
          $match: { _userId: req.user._id },
        },
        {
          $lookup: {
            from: 'validations',
            localField: '_validationId',
            foreignField: '_id',
            as: 'validations'
          }
        },
        {
          $addFields: {
            validation: { $arrayElemAt: ['$validations', 0] }
          }
        },
        {
          $group: {
            _id: '$_validationId',
            moneyUsed: { $sum: '$amount' },
            outcomeId: {
              $first: '$validation._outcomeId'
            }
          }
        },
        {
          $group: {
            _id: '$outcomeId',
            moneyUsed: { $sum: '$moneyUsed' },
            helped: { $sum: 1 }
          }
        }
      ]);
      
      let moneyImpact = {};
      for (let outcome of outcomes) {
        moneyImpact[outcome._id] = outcome;
      }

      return res.json(moneyImpact);
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
