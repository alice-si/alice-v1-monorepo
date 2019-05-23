const Auth = require('../service/auth');
const Utils = require('../service/utils');
const Donation = Utils.loadModel('donation');
const Impact = Utils.loadModel('impact');
const asyncHandler = require('express-async-handler');

module.exports = function (app) {
  app.get('/api/getMyTransactions', Auth.auth(), asyncHandler(async (req, res) => {
    const donations = await Donation.find({_userId: req.user._id});
    const aggregatedImpacts = await Impact.aggregate([{
      $match: {_userId: req.user._id}
    }, {
      $group: {
        _id: '$_validationId',
        total: {$sum: "$amount"},
        count: {$sum: 1}
      }
    }, {
      "$lookup": {
        from: "validations",
        localField: "_id",
        foreignField: "_id",
        as: "validation"
      }
    }, {
      "$unwind": {"path": "$validation"}
    }]);

    const impacts = aggregatedImpacts.map(function (item) {
      return {
        tx: item.validation.executionTx,
        amount: item.total,
        count: item.count
      };
    });
    return res.json({impacts, donations});
  }));
};