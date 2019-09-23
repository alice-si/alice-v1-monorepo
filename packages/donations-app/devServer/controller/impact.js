const Auth = require('../service/auth');
const Utils = require('../service/utils');
const Donation = Utils.loadModel('donation');

const asyncHandler = require('express-async-handler');

module.exports = function (app) {

  app.get(
    '/api/getMyProjects',
    Auth.auth(),
    asyncHandler(async (req, res) => {
      const result = await Donation.aggregate([
        {$match: {$and: [
          {_userId: req.user._id},
          {status: {$ne: '3DS'}},
          {status: {$ne: 'FAILED'}}
        ]}},
        {$group: {_id: '$_projectId', totalDonated: {$sum: "$amount"}}},
        {$lookup: {from: "projects", localField: "_id", foreignField: "_id", as: "project"}},
        {$unwind: "$project"},
        {$addFields: {"project.totalDonated": "$totalDonated"}},
        {$replaceRoot: {newRoot: "$project"}},
        {$lookup: {from: "charities", localField: "charity", foreignField: "_id", as: "charity"}},
        {$unwind: "$charity"},
        { // All impacts for project
          $lookup:
            {
              from: "impacts",
              let: {projectId: "$_id"},
              pipeline: [
                {
                  $match: {$expr:{$eq: ["$_projectId", "$$projectId"]}}
                },
                {$lookup: {from: "outcomes", localField: "_outcomeId", foreignField: "_id", as: "outcome"}},
                {$unwind: "$outcome"},
                {$group: {
                  _id: "$outcome._id",
                  totalSpent: {$sum: "$amount"},
                  target: {$first: "$outcome.amount"},
                  title: {$first: "$outcome.title"},
                  description: {$first: "$outcome.value"},
                  image: {$first: "$outcome.image"},
                  color: {$first: "$outcome.color"}
                }}
              ],
              as: "allImpactsForProject"
            }
        },
        {$addFields: {"project.totalDonated": "$totalDonated"}},
        { // User impacts for project
          $lookup:
            {
              from: "impacts",
              let: {projectId: "$_id"},
              pipeline: [
                {
                  $match:
                    {
                      $expr:
                        {
                          $and:
                            [
                              {$eq: ["$_projectId", "$$projectId"]},
                              {$eq: ["$_userId", req.user._id]}
                            ]
                        }
                    }
                },
                {$lookup: {from: "outcomes", localField: "_outcomeId", foreignField: "_id", as: "outcome"}},
                {$unwind: "$outcome"},
                {
                  $group: {
                    _id: "$outcome._id",
                    total: {$sum: "$amount"},
                    count: {$sum: 1},
                    title: {$first: "$outcome.title"},
                    color: {$first: "$outcome.color"}
                  }
                }
              ],
              as: "impacts"
            }
        },
        { // All outcomes for project
          $lookup: {
            from: "outcomes",
            let: {projectId: "$_id"},
            pipeline: [
              {$match: {$expr:
                {$eq: ["$_projectId", "$$projectId"]}
              }},
              {

                $lookup: { // User impacts for each outcome
                  from: "impacts",
                  let: {outcomeId: "$_id"},
                  pipeline: [
                    {$match: {$expr:
                      {$eq: ["$_outcomeId", "$$outcomeId"]},
                    }},
                    {$project: {
                      amount: "$amount",
                      amountForUser: {
                        $cond: [{$eq: ["$_userId", req.user._id]}, "$amount", 0]
                      },
                      impactForUser: {
                        $cond: [{$eq: ["$_userId", req.user._id]}, 1, 0]
                      },
                    }}
                  ],
                  as: "impacts"
                }
              },
              {$project: {
                "title": 1,
                "image": 1,
                "costPerUnit": 1,
                "quantityOfUnits": 1,
                "moneyUsed": { $sum: "$impacts.amount" },
                "moneyUsedForUser": { $sum: "$impacts.amountForUser" },
                "impactsForUser": { $sum: "$impacts.impactForUser" },
              }},
            ],
            as: "outcomes"
          }
        },
        { // All completed validations for project
          $lookup: {
            from: "validations",
            let: {projectId: "$_id"},
            pipeline: [
              {$match: {$expr: {
                $and: [
                  {$eq: ["$_projectId", "$$projectId"]},
                  {$eq: ["$status", "IMPACT_FETCHING_COMPLETED"]},
                ]}}},
              {$project: {"amount": 1}}
            ],
            as: "completedValidations",
          }
        },
        { // All donations that went through
          $lookup: {
            from: "donations",
            let: {projectId: "$_id"},
            pipeline: [
              {$match: {$expr: {
                $and: [
                  {$eq: ["$_projectId", "$$projectId"]},
                  {$eq: ["$status", "DONATED"]}
                ]}}},
              {$project: {"amount": 1}}
            ],
            as: "donations"
          }
        },
        {
          $addFields: {
            totalPaidOutOverall: {$sum: "$allImpactsForProject.totalSpent"},
            totalPaidOut: {$sum: "$impacts.total"},
            goalsAchieved: {$sum: "$impacts.count"},
            donatedByAll: {$add: [{$sum: "$donations.amount"}, {$ifNull: ["$externalFunding", 0]}]}
          }
        },
        {
          $project: {
            "totalDonated": 1,
            "allImpactsForProject": 1,
            "completedValidations": 1,
            "totalPaidOutOverall": 1,
            "code": 1,
            "status": 1,
            "fundingTarget": 1,
            "title": 1,
            "img": 1,
            "impacts": 1,
            "totalPaidOut": 1,
            "goalsAchieved": 1,
            "donatedByAll": 1,
            "externalFunding": 1,
            "lead": 1,
            "charity": 1,
            "ethAddresses": 1,
            "outcomes": 1,
            "typeOfBeneficiary": 1,
          }
        }
      ]);
      return res.json(result);
    }));

};
