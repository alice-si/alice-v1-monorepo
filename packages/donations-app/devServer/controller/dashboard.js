const Auth = require('../service/auth');
const distinctColors = require('distinct-colors');
const asyncHandler = require('express-async-handler');
const utils = require('../service/utils');
const project = utils.loadModel('project');

module.exports = function (app) {

  app.get('/api/getProjectsForMain', Auth.auth(), function (req, res) {
    return getProjectsForMain(req.user).then(result => res.json(result));
  });

  app.get('/api/getDonationsForProjects', Auth.auth(), function (req, res) {
    return getDonationsForProjects(req.user).then(result => res.json(result));
  });

  app.get('/api/getGoalsForProjects', Auth.auth(), asyncHandler(async (req, res) => {
    const colorHueMin = 200; // color hue for green color
    const colorHueMax = 245; // color hue for blue color

    const goals = await getGoalsForProjects(req.user);
    const outcomesAmount = goals.reduce((acc, cur) => acc + cur.outcomes.length, 0);
    const palette = distinctColors({
      count: outcomesAmount + 1,
      hueMin: colorHueMin,
      hueMax: colorHueMax
    });
    let counter = 0;
    const goalsWithColors = goals.map((cur) => {
      cur.outcomes.map(outcome => {
        counter++;
        outcome.color = palette[counter].hex();
      });
      return cur;
    });

    return res.json(goalsWithColors);
  }));

  var getProjectsForMain = function (user) {
    return project.aggregate([
      {$match: getProjectsCondition(user)},
      addLookupToProject("donations", "_projectId", "donations", ["amount"], "DONATED"),
      {
        $addFields: {
          "donated":
            {
              $add:
                [
                  {$ifNull: ["$externalFunding", 0]},
                  {$sum: "$donations.amount"}
                ]
            }
        }
      },
      {
        $lookup: {
          from: "charities",
          localField: "charity",
          foreignField: "_id",
          as: "charity"
        }
      },
      {$unwind: "$charity"},
      addLookupToProject("validations", "_projectId", "validations", ["amount"]),
      {$addFields: {"goalsAchieved": {$size: "$validations"}}},
      addLookupToProject("impacts", "_projectId", "impacts", ["amount"]),
      {$addFields: {"received": {$sum: "$impacts.amount"}}},
      utils.createProjection(["donated", "title", "img", "fundingTarget", "goalsAchieved", "received", "upfrontPayment", "code", "charity"])
    ]);
  };

  var getDonationsForProjects = function (user) {
    return project.aggregate([
      {$match: getProjectsCondition(user)},
      utils.createProjection(["_id", "title", "upfrontPayment"]),
      {
        $lookup: {
          from: "validations",
          let: {projectId: "$_id"},
          pipeline: [
            {
              $match: {
                $and: [
                  {$expr: {$eq: ["$_projectId", "$$projectId"]}},
                  {$expr: {$eq: ["$status", "IMPACT_FETCHING_COMPLETED"]}}
                ]
              }
            },
            utils.createProjection(["createdAt", "amount"]),
            {$sort: {createdAt: 1}},
          ],
          as: "validations"
        }
      },
      {
        $lookup: {
          from: "donations",
          let: {projectId: "$_id", projectUpfront: "$upfrontPayment"},
          pipeline: [
            {
              $match: {
                $and: [
                  {$expr: {$eq: ["$_projectId", "$$projectId"]}},
                  {$expr: {$eq: ["$status", "DONATED"]}}
                ]
              }
            },
            utils.createProjection(["_userId", "createdAt", "amount"]),
            {
              $group: {
                _id: "$_userId",
                total: {$sum: "$amount"},
                count: {$sum: 1},
                last: {$max: "$createdAt"}
              },
            },
            {$lookup: {from: "users", localField: "_id", foreignField: "_id", as: "user"}},
            {$unwind: "$user"},
            {
              $lookup: {
                from: "impacts",
                let: {userId: "$_id"},
                pipeline: [
                  {
                    $match: {
                      $and: [
                        {$expr: {$eq: ["$_projectId", "$$projectId"]}},
                        {$expr: {$eq: ["$_userId", "$$userId"]}}
                      ]
                    }
                  },
                  {$group: {_id: "$_userId", total: {$sum: "$amount"}}},
                  utils.createProjection(["total"])
                ],
                as: "paidOut"
              }
            },
            {$addFields: {paidOut: {
              $sum: [
                {$sum: "$paidOut.total"},
                {$divide: [{$multiply: ["$$projectUpfront", "$total"]}, 100]}
              ]
            }}},
            {
              $addFields: {
                "user.fullName": {$concat: ["$user.firstName", " ", "$user.lastName"]},
                "user.total": "$total",
                "user.last": "$last",
                "user.paidOut": "$paidOut",
                "user.count": "$count"
              }
            },
            {$replaceRoot: {newRoot: "$user"}},
            utils.createProjection([
              "total", "count", "last", "_id", "fullName", "giftAid", "agreeContact", "email", "paidOut"
            ]),
          ],
          as: "users"
        }
      },
      {
        $lookup: {
          from: "donations",
          let: {projectId: "$_id"},
          pipeline: [
            {
              $match: {
                $and: [
                  {$expr: {$eq: ["$_projectId", "$$projectId"]}},
                  {$expr: {$eq: ["$status", "DONATED"]}}
                ]
              }
            },
            utils.createProjection(["amount", "createdAt"]),
            {$sort: {"createdAt": 1}}
          ],
          as: "donations"
        }
      }
    ]);
  };

  var getGoalsForProjects = function (user) {
    return project.aggregate([
      {$match: getProjectsCondition(user)},
      {
        $lookup: {
          from: "validations",
          let: {projectId: "$_id"},
          pipeline: [
            {
              $match: {
                $and: [
                  {$expr: {$eq: ["$_projectId", "$$projectId"]}},
                  {$expr: {$eq: ["$status", "IMPACT_FETCHING_COMPLETED"]}}
                ]
              }
            },
            utils.createProjection(["_outcomeId", "impact_fetchingTime"]),
            {$sort: {impact_fetchingTime: 1}},
            {$group: {_id: "$_outcomeId", validations: {$push: {time: "$impact_fetchingTime"}}}},
            {$lookup: {from: "outcomes", localField: "_id", foreignField: "_id", as: "outcome"}},
            {$addFields: {title: "$outcome.title"}},
            utils.createProjection(["_id", "title", "validations"]),
            {$unwind: "$title"},
          ],
          as: "outcomes"
        }
      },
      utils.createProjection(["_id", "title", "outcomes"])
    ]);
  };

  var getProjectsCondition = function (user) {
    var projectsCondition = {"_id": {$in: user.managerAccess.concat(user.charityAdminAccess)}};
    if (user.superadmin) {
      projectsCondition = {};
    }
    return projectsCondition;
  };

  var addLookupToProject = function (from, foreignField, name, fields, statusForFilter = null) {
    var pipeline = [
      {$match: {$expr: {$eq: ["$" + foreignField, "$$projectId"]}}}
    ];
    if (statusForFilter) {
      pipeline = [
        {$match: {$expr: {$and: [ {$eq: ["$" + foreignField, "$$projectId"]}, {$eq: ["$status", statusForFilter]} ]}}}
      ];
    }
    pipeline.push(utils.createProjection(fields));
    var res =
      {
        $lookup: {
          from: from,
          let: {projectId: "$_id"},
          pipeline: pipeline,
          as: name
        }
      };
    return res;
  };
};
