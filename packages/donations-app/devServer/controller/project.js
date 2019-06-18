const AccessControl = require('../service/access-control');
const Auth = require('../service/auth');
const Mango = require('../service/mango');
const Utils = require('../service/utils');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Model loading
const Category = Utils.loadModel('category');
const Validation = Utils.loadModel('validation');
const Project = Utils.loadModel('project');
const Charity = Utils.loadModel('charity');
const Donation = Utils.loadModel('donation');
const ProjectHistory = Utils.loadModel('projectHistory');
const Outcome = Utils.loadModel('outcome');

module.exports = function (app) {

  app.get(
    '/api/getProjectsForAdmin',
    Auth.auth(),
    asyncHandler(async (req, res) => {
      const projects = await Project.aggregate([
        {$match: getProjectAccessCondition(req.user)},
        Utils.createProjection([
          "_id",
          "code",
          "title",
          "status"
        ])
      ]);
      return res.json(projects);
    }));

	app.get(
    '/api/getActiveProjects',
    asyncHandler(async (req, res) => {
      const projects = await Project.find({status: 'ACTIVE'});
      return res.json(projects);
    }));

  app.get(
    '/api/getAllProjects',
    asyncHandler(async (req, res) => {
      const projects = await Project.aggregate([
        Utils.createProjection([
          "code",
          "title",
          "description",
          "img"
        ])
      ]);
      return res.json(projects);
    }));

  app.get(
    '/api/getPilotProject',
    asyncHandler(async (req, res) => {
      const projects = await Project.findOne({
        code: 'mungos-15-lives'
      });
      return res.json(projects);
    }));

  // Returns detailed information about a project by its code.
  //
  // Accepts following query parameters:
  // - countValidations: if set, returns additional fields
  //                      "amountValidated" and "amountAvailable".
  app.get('/api/projects/:code', asyncHandler(async (req, res) => {
    let project = await Project.findOne({ code: req.params.code })
      .populate('_outcomes charity');
    project = project.toObject();

    if (!project) {
      return res.status(404).send(`Project "${req.params.code}" not found`);
    }

    let donations = await Donation.aggregate([
      {
        $match: {
          //FIXME: Needs blockchain processing
          //$and: [{ _projectId: project._id }, { status: 'DONATED' }]
          $and: [{ _projectId: project._id }, { status: {$ne: 'FAILED'} }]
        }
      },
      {
        $group: { _id: null, total: { $sum: '$amount' } }
      }
    ]);

    project.raised = donations.length > 0 ? donations[0].total : 0;
    if (project.externalFunding) {
      project.raised += project.externalFunding;
    }

    project.needed = project.fundingTarget - project.raised;

    // if (req.query.countValidations) {
      project.amountValidated =
        await Utils.getAmountValidatedForProject(project);
      project.amountAvailable = project.raised - project.amountValidated;
    // }


		// Added this backend function for new appeal page design
		// Goals require current validation progress
		// as well as goal features
		let goalsV2 = await Validation.aggregate([
	    {
	      $match: {
	        $and: [
	          { _projectId: project._id },
	          { status: { $not: /CREATED|CLAIMING_/ }},
	        ]
	      }
	    },
	    {
	      $group: { _id: "$_outcomeId", totalValidatedForOutcome: {$sum: "$amount"} }
	    },
	    { $lookup: { from: "outcomes", localField: "_id", foreignField: "_id", as: "outcome"} },
	    {$unwind: "$outcome"}
	  ]);

		project.goalsV2 = (goalsV2.length > 0) ? goalsV2 : [];

    res.json(project);
  }));

  app.get(
    '/api/getSupporters/:projectId',
    asyncHandler(async (req, res) => {
      const donations = await Donation.aggregate([
        {
          $match: {
            _projectId: mongoose.Types.ObjectId(req.params.projectId)
          }
        },
        {
          $group: {
            _id: '$_userId',
            total: {$sum: "$amount"}
          }
        },
        {
          "$lookup": {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          "$unwind": {"path": "$user"}
        }
      ]);

      return res.json(donations);
    }));

    app.post(
      '/api/saveProjectWithOutcomes',
      Auth.auth(),
      AccessControl.Middleware.hasAdminAccess(req => req.body._id),
      asyncHandler(async (req, res) => {
        const projectWithOutcomes = req.body;
        let savedProject = await Utils.upsertEntityAsync(
          projectWithOutcomes,
          Project,
          (entity => {
            if (AccessControl.isSuperadmin(req.user)) {
              // Superadmin can change entity.charity arbitrarily.
            } else if (AccessControl.hasSomeCharityAdminAccess(req.user)) {
              // Override charity field if user is charity-admin.
              entity.charity = req.user.charityAdmin;
            }
            let project = new Project(entity);
            project.htmlFieldsDecode();
            return project;
          })
        );

        await checkMangoWallets(savedProject);

        // TODO when we move to monorepo addProjectToCharity function
        // should be refactored and be a Promise
        await new Promise((resolve, reject) => {
          Charity.addProjectToCharity(savedProject, (err) => {
            if (err) {
              reject();
            } else {
              resolve();
            }
          });
        });

        await lazyOutcomesUpdate(projectWithOutcomes, savedProject);

        // adding project history
        await new ProjectHistory({
          project: savedProject,
          outcomes: req.body.outcomes,
          changedBy: req.user._id
        }).save();

        res.json(savedProject);

      }));

  app.post(
    '/api/removeProjectWithOutcomes',
    Auth.auth(),
    AccessControl.Middleware.hasAdminAccess(req => req.body._id),
    asyncHandler(async (req, res) => {
      console.log('Removing the project: ' + req._id);
      await Project.findById(req.body._id).remove();

      console.log('Updating corresponding categories');
      await Category.findByIdAndUpdate(
        req.body._categoryId,
        {
          $pull: {"_projects": req.body._id}
        },
        {
          safe: true,
          new: true
        });

      console.log('Removing corresponding outcomes');
      await Outcome.find({_projectId: req.body._id}).remove();

      return res.json();
    }));

  function getProjectAccessCondition(user) {
    if (user) {
      if (user.superadmin) {
        return {};
      } else {
        return {
          $expr: {
            $in: ["$_id", user.adminAccess.concat(user.charityAdminAccess)]
          }
        };
      }
    }
    return {_id: []};
  }

  // This function sets mangoBeneficiaryWalletId and mangoContractWalletId
  // for passed project (if at least one of these fields is not already set)
  async function checkMangoWallets(project) {
    if (!project.mangoContractWalletId || !project.mangoBeneficiaryWalletId) {
      const charity = await Charity.findById(project.charity);
      if (!charity || !charity.mangoUserId) {
        throw new Error('Charity does not have mango account');
      }
      let projectObj = project.toObject();
      projectObj.charity = charity;

      const wallets = await Mango.registerWalletsForProject(projectObj);
      project.mangoBeneficiaryWalletId = wallets.beneficiaryWalletId;
      project.mangoContractWalletId = wallets.contractWalletId;

      return await project.save();
    }
  }

  async function lazyOutcomesUpdate(projectWithOutcomes, savedProject) {
    let outcomesWithIds = [];
    let outcomesWithoutIds = [];
    for (let outcome of projectWithOutcomes.outcomes) {
      outcome._projectId = savedProject._id;
      if (outcome._id) {
        outcomesWithIds.push(outcome);
      } else {
        outcomesWithoutIds.push(outcome);
      }
    }

    let oldOutcomes = await Outcome.find({_projectId: savedProject._id});
    let diff = Utils.compareObjects(outcomesWithIds, oldOutcomes);
    let bulk = Outcome.collection.initializeUnorderedBulkOp();
    // new outcomes insertion
    outcomesWithoutIds.forEach(function (newOutcome) {
      bulk.insert(newOutcome);
    });
    // changed outcomes updating
    diff.toAdd.forEach(function (changedOutcome) {
      const id = mongoose.Types.ObjectId(changedOutcome._id);
      delete changedOutcome._id;
      bulk.find({_id: id}).update({$set: changedOutcome});
    });
    // removed outcomes removing
    diff.toRemove.forEach(function (removedOutcome) {
      bulk
        .find({_id: mongoose.Types.ObjectId(removedOutcome._id)})
        .removeOne();
    });

    // Executing bulk DB operation
    if (Utils.bulkHasOperations(bulk)) {
      await bulk.execute();
    }

    // setting _outcomes field in project document
    const newOutcomesIds = await Outcome
      .find({_projectId: savedProject._id})
      .select("_id");
    savedProject._outcomes = newOutcomesIds;
    await savedProject.save();
  }
};
