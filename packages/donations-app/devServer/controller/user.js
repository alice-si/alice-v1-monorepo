const Auth = require('../service/auth');
const Utils = require('../service/utils');
const User = Utils.loadModel('user');
const AccessControl = require('../service/access-control');
const asyncHandler = require('express-async-handler');

module.exports = function (app) {
  app.get(
    '/api/userSearch/:search', Auth.auth(),
    AccessControl.Middleware.hasSomeCharityAdminAccess,
    asyncHandler(async (req, res) => {
      const users = await getUsersDetails({
        details: new RegExp(req.params.search, 'ig')
      });
      return res.json(users);
    }));

  app.post(
    '/api/getUsersData',
    Auth.auth(),
    AccessControl.Middleware.hasSomeCharityAdminAccess,
    asyncHandler(async (req, res) => {
      const users = await getUsersDetails({
        $expr: {$in: ['$_id', Utils.prepareIdList(req.body)]}
      });
      return res.json(users);
    }));

  app.get(
    '/api/getAllUsers',
    Auth.auth(),
    AccessControl.Middleware.isSuperadmin,
    asyncHandler(async (req, res) => {
      const users = await User.aggregate([
        {
          $lookup: {
            from: 'donations',
            localField: '_id',
            foreignField: '_userId',
            as: 'donations',
          }
        },
        {
          $addFields: {
            successfulDonations: {
              $filter: {
                input: '$donations',
                as: 'donation',
                cond: { $eq: ['$$donation.status', 'DONATED'] }
              }
            }
          }
        },
        {
          $project: {
            fullName: {$concat: ['$firstName', ' ', '$lastName']},
            email: true,
            createdAt: {$toDate: '$_id'},
            agreeContact: true,
            totalDonations: {$sum: '$successfulDonations.amount'},
            timesDonated: {$size: '$successfulDonations'},
          }
        },
      ]);
      return res.json(users);
    }));

  app.get(
    '/api/getPublicUserData/:userId',
    asyncHandler(async (req, res) => {
      if (!req.params.userId) {
        return res.status(400).send('UserId param required');
      }
      let userFound = await User.findById(req.params.userId, 'email');
      if (!userFound) {
        return res.status(400).send(`User not found: ${req.params.userId}`);
      }
      res.json(userFound);
    }));

  app.get(
    '/api/user/:userId',
    Auth.auth(),
    AccessControl.Middleware.hasAccessToUserDetails(req => req.params.userId),
    asyncHandler(async (req, res) => {
      const user = await Utils.getUserDetailsById(req.params.userId);
      return res.json(user);
    }));

  function getUsersDetails(condition) {
    return User.aggregate([
      {$project: {details: {$concat: ['$firstName', ' ', '$lastName', ' (', '$email', ')']}}},
      {$match: condition}
    ]);
  }
};
