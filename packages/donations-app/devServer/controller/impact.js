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
        {
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
        //TODO: Check if we still need donatedByAll
        {
          $lookup: {
            from: "donations",
            let: {projectId: "$_id"},
            pipeline: [
              {$match: {$expr: {
                $and: [
                  {$eq: ["$_projectId", "$$projectId"]},
                  {$ne: ["$status", "3DS"]},
                  {$ne: ["$status", "FAILED"]}
                ]}}},
              {$project: {"amount": 1}}
            ],
            as: "donations"
          }
        },
        {
          $addFields: {
            totalPaidOut: {$sum: "$impacts.total"},
            goalsAchieved: {$sum: "$impacts.count"},
            donatedByAll: {$add: [{$sum: "$donations.amount"}, {$ifNull: ["$externalFunding", 0]}]}
          }
        },
        {
          $project: {
            "totalDonated": 1,
            "code": 1,
            "fundingTarget": 1,
            "title": 1,
            "img": 1,
            "impacts": 1,
            "totalPaidOut": 1,
            "goalsAchieved": 1,
            "donatedByAll": 1,
            "externalFunding": 1,
            "lead": 1,
            "ethAddresses": 1
          }
        },
      ]);
      return res.json(result);
    }));

};
