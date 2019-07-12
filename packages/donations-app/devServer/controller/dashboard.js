const Auth = require('../service/auth');
const distinctColors = require('distinct-colors');
const Utils = require('../service/utils');
const Project = Utils.loadModel('project');
const Outcome = Utils.loadModel('outcome');
const Validation = Utils.loadModel('validation');
const Donation = Utils.loadModel('donation');
const User = Utils.loadModel('user');
const asyncHandler = require('express-async-handler');

module.exports = function (app) {

  app.get('/api/getProjectsForMain', Auth.auth(), function (req, res) {
    return getProjectsForMain(req.user).then(result => res.json(result));
  });

  app.get('/api/getDonationsForProjects', Auth.auth(), function (req, res) {
    return getDonationsForProjects(req.user).then(result => res.json(result));
  });

  app.get('/api/getDonationsForProject/:code', Auth.auth(), asyncHandler(async (req, res, next) => {
      let project = await Project.findOne({ code: req.params.code });
      if(!project) {
        return req.status(400).send('Unknown project code');
      }

      let donations = await findAndPrepareDonations({
        // status: 'ACTIVE',
        _id: project._id,
      });


      res.status(200).json(donations);

      async function findAndPrepareDonations(filter) {
        return await Project.aggregate([
          {$match: filter},
          Utils.createProjection(["_id"]),
          {
            $lookup: {
              from: "validations",
              let: {projectId: filter._id},
              pipeline: [
                {
                  $match: {
                    $and: [
                      {$expr: {$eq: ["$_projectId", "$$projectId"]}},
                      {$expr: {$eq: ["$status", "IMPACT_FETCHING_COMPLETED"]}}
                    ]
                  }
                },
                Utils.createProjection(["createdAt", "amount"]),
                {$sort: {createdAt: 1}},
              ],
              as: "validations"
            }
          },
          {
            $lookup: {
              from: "donations",
              let: {projectId: filter._id},
              pipeline: [
                {
                  $match: {
                    $and: [
                      {$expr: {$eq: ["$_projectId", "$$projectId"]}},
                      {$expr: {$eq: ["$status", "DONATED"]}}
                    ]
                  }
                },
                Utils.createProjection(["_userId", "createdAt", "amount"]),
                {$lookup: {from: "users", localField: "_userId", foreignField: "_id", as: "user"}},
                {$unwind: "$user"},
                {
                  $lookup: {
                    from: "impacts",
                    let: {userId: "$user._id"},
                    pipeline: [
                      {
                        $match: {
                          $and: [
                            {$expr: {$eq: ["$_projectId", "$$projectId"]}},
                            {$expr: {$eq: ["$_userId", "$$userId"]}}
                          ]
                        }
                      },
                    ],
                    as: "received"
                  }
                },
                {
                  $addFields: {
                    "user.fullName": {$concat: ["$user.firstName", " ", "$user.lastName"]},
                    "user.donated": "$amount",
                    "user.date": "$createdAt",
                    "user.received": "$received"
                  }
                },
                {$replaceRoot: {newRoot: "$user"}},
                Utils.createProjection([
                  "donated", "date", "_id", "fullName", "giftAid", "agreeContact", "email", "received"
                ]),
              ],
              as: "users"
            }
          },
          {
            $lookup: {
              from: "donations",
              let: {projectId: filter._id},
              pipeline: [
                {
                  $match: {
                    $and: [
                      {$expr: {$eq: ["$_projectId", "$$projectId"]}},
                      {$expr: {$eq: ["$status", "DONATED"]}}
                    ]
                  }
                },
                {
                  $project:
                  {
                    _id: false,
                    amount: true,
                    day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                  }
                },
                {
                  $group: {
                    _id: { createdAt : "$day" },
                    amount: { $sum: "$amount" }
                  }
                },
                {
                  $addFields: {
                    createdAt: "$_id.createdAt"
                  }
                },
                Utils.createProjection(["amount", "createdAt"]),
                {$sort: {"createdAt": 1}}
              ],
              as: "donations"
            }
          }
        ]);
      }
  }));

  // Return an object
  // { current_project: {}, validated: [], donated: [], goals: [] }
  // to be used for charity dashboard
  app.get('/api/getImpactsForProject/:code', Auth.auth(), asyncHandler(async (req, res, next) => {
      let project = await Project.findOne({ code: req.params.code });
      if(!project) {
        return req.status(400).send('Unknown project code');
      }

      let current_project = {
        title: project.title,
        img: project.img,
        initializerImg: project.initializerImg,
      };

      // Project validator
      let projectValidator = await findValidatorEmail(project._id);
      projectValidator = projectValidator[0];

      // Info required for outcome-claim cards
      let goals = await findGoals({
        _projectId: project._id,
      });

      let validated = await findAndPrepareGoals({
        _projectId: project._id,
        status: { $in: ['COMPLETED','IMPACT_FETCHING_COMPLETED'] }
      });

      let donated = await findAndPrepareGoals({
        status: 'CREATED',
        _projectId: project._id,
      });

      res.status(200).json({ projectValidator, current_project, validated, donated, goals });

      async function findAndPrepareGoals(filter) {
        let label = (filter.status === 'CREATED') ? 'totalDonated' : 'totalValidated';
        return await Validation.aggregate([
          {$match: filter},
          {
            $group : {
              _id :  "$_outcomeId",
              [label] : { $sum: "$amount" },
            },
          },
          {
            $lookup: {
              from: 'outcomes',
              localField: '_id',
              foreignField: '_id',
              as: 'outcome',
            }
          }
        ]);
      }

      async function findGoals(id) {
        return await Outcome.aggregate([
          {$match: id},
          Utils.createProjection(["_id", "image", "title"]),
        ]);
      }

      // Can be extended for proof type
      async function findValidatorEmail(projectId) {
        return await User.find(
          { 'validator': { $eq: projectId }},
          { email: 1, _id: 0 }
        );
      }
  }));

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
    return Project.aggregate([
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
      Utils.createProjection(["donated", "title", "img", "fundingTarget", "goalsAchieved", "received", "upfrontPayment", "code", "charity"])
    ]);
  };

  var getDonationsForProjects = function (user) {
    return Project.aggregate([
      {$match: getProjectsCondition(user)},
      Utils.createProjection(["_id", "title", "upfrontPayment"]),
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
            Utils.createProjection(["createdAt", "amount"]),
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
            Utils.createProjection(["_userId", "createdAt", "amount"]),
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
                  Utils.createProjection(["total"])
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
            Utils.createProjection([
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
            Utils.createProjection(["amount", "createdAt"]),
            {$sort: {"createdAt": 1}}
          ],
          as: "donations"
        }
      }
    ]);
  };

  var getGoalsForProjects = function (user) {
    return Project.aggregate([
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
            Utils.createProjection(["_outcomeId", "impact_fetchingTime"]),
            {$sort: {impact_fetchingTime: 1}},
            {$group: {_id: "$_outcomeId", validations: {$push: {time: "$impact_fetchingTime"}}}},
            {$lookup: {from: "outcomes", localField: "_id", foreignField: "_id", as: "outcome"}},
            {$addFields: {title: "$outcome.title"}},
            Utils.createProjection(["_id", "title", "validations"]),
            {$unwind: "$title"},
          ],
          as: "outcomes"
        }
      },
      Utils.createProjection(["_id", "title", "outcomes"])
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
    pipeline.push(Utils.createProjection(fields));
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
