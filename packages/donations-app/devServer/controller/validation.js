const asyncHandler = require('express-async-handler');

const Auth = require('../service/auth');
const AccessControl = require('../service/access-control');
const Utils = require('../service/utils');
const Mail = require('../service/mail');

const Outcome = Utils.loadModel('outcome');
const Project = Utils.loadModel('project');
const Validation = Utils.loadModel('validation');

// FIXME: remove this function
async function linkImpacts(validation) {
  console.log('Linking outcomes and fetching impacts for validation: ' + validation._id);

  // We load modules here for being able to remove it with function after demo
  const User = Utils.loadModel('user');
  const Impact = Utils.loadModel('impact');

  const usersFromDB = await User.aggregate([
    {
      $lookup: {
        from: "donations",
        let: {
          projectId: validation._projectId,
          userId: "$_id"
        },
        pipeline: [
          {
            $match: {
              $and: [
                {$expr: {$eq: ["$_projectId", "$$projectId"]}},
                {$expr: {$eq: ["$_userId", "$$userId"]}},
                {$expr: {$eq: ["$status", "DONATED"]}}
              ]
            }
          }
        ],
        as: "donations"
      },
    },
    {
      $lookup: {
        from: "impacts",
        let: {
          projectId: validation._projectId,
          userId: "$_id"
        },
        pipeline: [
          {
            $match: {
              $and: [
                {$expr: {$eq: ["$_projectId", "$$projectId"]}},
                {$expr: {$eq: ["$_userId", "$$userId"]}},
              ]
            }
          }
        ],
        as: "impacts"
      },
    }
  ]);

  // Calculating balance for each user
  const users = usersFromDB.map(function (userFromDB) {
    function sumAmount(acc, cur) {
      return acc + cur.amount;
    }

    const userDonated = userFromDB.donations.reduce(sumAmount, 0);
    const userImpactAmount = userFromDB.impacts.reduce(sumAmount, 0);

    userFromDB.balance = userDonated - userImpactAmount;

    return userFromDB;
  });

  // Filtering donors (only donors with positive balance could make a new impact)
  let donors = users.filter(function (user) {
    return user.balance > 0;
  });

  // Donors sorting based on balances for current project
  donors.sort(function (donor1, donor2) {
    return donor1.balance - donor2.balance;
  });

  // Donors list logging
  console.log(donors.map(function ({_id, email, balance, donations, impacts}) {
    return {
      _id,
      email,
      balance,
      donationsLen: donations.length,
      impactsLen: impacts.length
    };
  }))

  let amountAvailable = donors.reduce(function (acc, cur) {
    return acc + cur.balance;
  }, 0);
  let amountLeft = validation.amount;
  let counter = 0;
  for (let donor of donors) {
    console.log(`Donor: ${donor.email}, Amount left: ${amountLeft}, Available: ${amountAvailable}`);

    if (amountLeft > 0) {
      // Calculating impact amount for current donor
      const minImpactValue = 50;

      // First option (almost equal impact amount for everyone)
      const donorsLeft = donors.length - counter; // donorsLeft > 0
      let amountForDonor = Math.max(amountLeft / donorsLeft, minImpactValue);

      // Second option (impact amount depends on donor's balance) - currently disabled
      // let amountForDonor = Math.max((donor.balance / amountAvailable) * amountLeft, minImpactValue);

      // If we came to the last donor (donor with the biggest balance)
      if (counter == donors.length - 1) {
        amountForDonor = amountLeft;
      }

      if (amountForDonor > donor.balance) {
        amountForDonor = donor.balance;
      }

      console.log(`Donor impact: ${amountForDonor}`);

      // Creating a new impact for current donor
      let savedImpact = await new Impact({
        _projectId: validation._projectId,
        _outcomeId: validation._outcomeId,
        _userId: donor._id,
        _validationId: validation._id,
        amount: amountForDonor
      }).save();

      //Send confirmation email
      let projectWithCharity = await Project.findById(validation._projectId).populate('charity');
      await Mail.sendImpactConfirmation(donor, projectWithCharity, savedImpact);

      // Updating accumulated values
      amountLeft -= amountForDonor;
      amountAvailable -= amountForDonor;
      donor.balance -= amountForDonor;
      counter++;
    } else {
      console.log('Donor skipped');
    }
  }
}

module.exports = function (app) {
  // Returns a summary for all projects that the user is a validator of.
  app.get(
    '/api/getValidatorSummary',
    Auth.auth(),
    asyncHandler(async (req, res) => {
      let filter = { status: 'ACTIVE' };
      if (!req.user.superadmin) {
        if (req.user.validator && req.user.validator.length > 0) {
          Object.assign(filter, { _id: {$in: req.user.validator} });
        } else {
          return res.status(403).send('Access is restricted to validators.');
        }
      }

      let projects = await Project.find(filter, 'code title img -_id');
      res.json(projects);
  }));

  // Return an object { claimed: ..., processingValidation: ... validated: ... }
  // with validations that
  // 1) are claimed.
  // 2) have been approved, but not yet finished processing.
  // 3) have been successfully validated.
  app.get(
    '/api/projects/:code/validations',
    Auth.auth(),
    asyncHandler(async (req, res, next) => {
      let project = await Project.findOne({ code: req.params.code });
      if (!project) {
        return req.status(400).send('Unknown project code');
      }

      let claimed = await findAndPrepareValidations({
        status: 'CLAIMING_COMPLETED',
        _projectId: project._id,
      });

      let processingValidation = await findAndPrepareValidations({
        status: {
          $regex: /^(APPROVED|VALIDATING_|LINKING_|IMPACT_FETCHING_(?!COMPLETED))/,
        },
        _projectId: project._id,
      });

      let validated = await findAndPrepareValidations({
        status: 'IMPACT_FETCHING_COMPLETED',
        _projectId: project._id,
      });

      res.json({ claimed, processingValidation, validated });

      async function findAndPrepareValidations(filter) {
        return await Validation.aggregate([
          { $match: filter },
          {
            $lookup: {
              from: 'outcomes',
              localField: '_outcomeId',
              foreignField: '_id',
              as: 'outcome',
            }
          },
          { $unwind: '$outcome' },
          {
            $project: {
              status: true,
              outcome: {
                amount: true,
                description: true,
                completion: true,
                image: true,
                title: true,
              },
            }
          },
        ]);
      }
  }));

  app.post(
    '/api/claimOutcome',
    Auth.auth(),
    checkPasswordInPayload,
    asyncHandler(async (req, res) => {
      let { outcomeId, quantity } = req.body;
      if (!outcomeId) {
        return res.status(400).send('Must specify "outcomeId"');
      }
      if (!quantity) {
        return res.status(400).send('Must specify "quantity"');
      }

      let outcome = await Outcome.findById(req.body.outcomeId);
      if (!outcome) {
        return res.status(400).send('Outcome with given id not found');
      }

      let project = await Project.findById(outcome._projectId);
      if (!AccessControl.hasCharityAdminAccess(req.user, project.charity)) {
        return res.status(403).send('Forbidden');
      }

      let totalClaim = quantity * outcome.amount;
      let maximumClaim = project.fundingTarget
        - await Utils.getAmountClaimedForProject(project);
      if (totalClaim > maximumClaim) {
        return res.status(400).send(
          `Cannot claim ${totalClaim / 100} GBP: only ` +
          `${maximumClaim / 100} GBP left to claim before project target ` +
          `is achieved`);
      }

      let validations = [];
      for (let i = 0; i < quantity; i++) {
        validations.push(new Validation({
          _outcomeId: outcome._id,
          _projectId: outcome._projectId,
          _claimerId: req.user._id,
          amount: outcome.amount,
          createdAt: new Date(),
          // status: 'CREATED'
          // FIXME claiming should go through blockhain
          status: 'CLAIMING_COMPLETED'
        }));
      }

      let savedValidations = await Validation.insertMany(validations);
      return res.json(savedValidations);
    }));

  app.post(
    '/api/approveClaim',
    Auth.auth(),
    checkPasswordInPayload,
    asyncHandler(async (req, res, next) => {
      let validation = await Validation.findById(req.body.validationId);
      if (!validation) {
        return res.status(400).send('Validation with given id not found');
      }

      let project = await Project.findById(validation._projectId);
      if (!AccessControl.hasValidatorAccess(req.user, validation._projectId)) {
        return res.status(403).send('Unauthorized to approve this claim');
      }

      if (validation.status != 'CLAIMING_COMPLETED') {
        return res.status(400)
          .send(`Invalid claim status: ${validation.status}`);
      }

      let fundsAvailable = await Utils.getAmountAvailableForProject(project);
      if (fundsAvailable < validation.amount) {
        return res.status(400).send(
          `Project has ${fundsAvailable / 100} GBP available, ` +
          `but outcome requires ${validation.amount / 100} GBP`);
      }

      // FIXME remove
      await linkImpacts(validation);
      // FIXME validation should go through blockchain
      // validation.status = 'APPROVED';
      validation.status = 'IMPACT_FETCHING_COMPLETED';
      validation._validatorId = req.user._id;
      await validation.save();

      res.send('OK');
  }));

  async function checkPasswordInPayload(req, res, next) {
    if (!req.body.password) {
      return res.status(401).send('Password must be sent in payload');
    }
    if (!await Auth.comparePassword(req.user, req.body.password)) {
      return res.status(401).send('Wrong password');
    }
    next();
  }
};
