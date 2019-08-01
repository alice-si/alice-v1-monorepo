const AccessControl = require('../service/access-control');
const Utils = require('../service/utils');
const Mango = require('../service/mango');
const Auth = require('../service/auth');
const asyncHandler = require('express-async-handler');

const User = Utils.loadModel('user');
const Charity = Utils.loadModel('charity');

module.exports = function (app) {

  // This ep is used in charity and project-wizard views
  // for superadmins it returns list with all charities
  // for other users it sends unauthorised (401) repsponse
  app.get(
    '/api/getCharitiesForAdmin',
    Auth.auth(),
    AccessControl.Middleware.isSuperadmin,
    asyncHandler(getCharitiesEP));

  // This ep works in the same way as getCharitiesForAdmin
  // but it doesn't require authorization
  app.get('/api/getCharities', asyncHandler(getCharitiesEP));

  app.get('/api/charities/:charityId', asyncHandler(async (req, res) => {
    const foundCharity = await Charity.findById(req.params.charityId,
      '_id code name picture url');
    if (!foundCharity) {
      res.status(404)
        .send(`No charity found with the id: ${req.params.charityId}`);
    }
    res.json(foundCharity);
  }));


  app.get(
    'api/getCharityForProject/:projectId',
    Auth.auth(),
    asyncHandler(async (req, res) => {
      Charity.find({
        projects: req.params.projectId
      });
    })
  )

  app.get(
    '/api/getCharity/:code',
    Auth.auth(),
    AccessControl.Middleware.hasCharityAdminAccessByCode(req => req.params.code),
    asyncHandler(async (req, res) => {
      let pipeline = [
        {$match: {$expr: {$eq: [req.params.code, "$code"]}}},
        Utils.createProjection([
          "_id",
          "code",
          "url",
          "name",
          "legalName",
          "description",
          "projectAdmins",
          "projectManagers",
          "picture"
        ])
      ];

      // Adding charityAdmins field is user has superadmin access
      if (AccessControl.isSuperadmin(req.user)) {
        pipeline.push({
          $lookup: {
            from: "users",
            let: {charityId: "$_id"},
            pipeline: [
              {$match: {$expr: {$eq: ["$charityAdmin", "$$charityId"]}}},
              Utils.createProjection(["_id"]),
            ],
            as: "charityAdmins"
          }
        });
      }

      const charities = await Charity.aggregate(pipeline);

      if (charities.length > 1 || charities.length == 0) {
        res.status(500)
          .send("Wrong number of charities: " + charities.length);
      }

      // Response beautifying
      let charityObj = charities[0];
      if (charityObj && charityObj.charityAdmins) {
        charityObj.charityAdmins =
          charityObj.charityAdmins.map(user => user._id);
      }

      return res.json(charityObj);
    }));

  app.post(
    '/api/saveCharity',
    Auth.auth(),
    AccessControl.Middleware.hasCharityAdminAccess(req => req.body._id),
    asyncHandler(async (req, res) => {
      const {charityAdminUpdateRequested, err} = await validateRequest(req);
      if (err) {
        return res.status(400).send(err);
      }


      // Charity saving
      let savedCharity = await Utils.upsertEntityAsync(req.body, Charity, (entity => {
        let charityObj = new Charity(entity);
        charityObj.prepareForSaving();
        return charityObj;
      }));

      // Charity admin updating
      if (AccessControl.isSuperadmin(req.user) && charityAdminUpdateRequested) {
        await updateCharityAdmin(req.body.charityAdmins[0], savedCharity._id);
      }

      // Registering charity in mangopay
      if (!savedCharity.mangoUserId) {
        const charityAdmin = await User.findOne({charityAdmin: savedCharity._id});
        charityAdmin.birthday = Mango.convertBirthday(charityAdmin.dateOfBirth);
        const mangoUserId = await Mango.registerCharity(savedCharity.name, charityAdmin);
        savedCharity.mangoUserId = mangoUserId;
        await savedCharity.save();
      }

      res.json(savedCharity);
    }));

  async function getCharitiesEP(req, res) {
    const charities = await Charity.aggregate([
      Utils.createProjection(["_id", "code", "name", "url", "picture"])
    ]);
    return res.json(charities);
  }

  // This function analyses request for saveCharity ep
  // It returns object with the following fields
  // - err (with err message if request is incorrect, otherwsie - undefined)
  // - charityAdminUpdateRequested (set to true if charityAdmin update requested)
  async function validateRequest(request) {
    let charityAdminUpdateRequested = false;

    if (AccessControl.isSuperadmin(request.user)) {
      const charityAdmins = request.body.charityAdmins;
      if (!charityAdmins || charityAdmins.length != 1) {
        const numberOfAdminsSelected = charityAdmins ? charityAdmins.length : 0;
        return {
          err: `You should choose exactly one charity admin, selected: ${numberOfAdminsSelected}`
        };
      }
      let userObj = await User.findById(charityAdmins[0]).populate('charityAdmin');
      const previousCharityId = userObj.charityAdmin ? userObj.charityAdmin._id : null;
      charityAdminUpdateRequested =
        !(previousCharityId && previousCharityId.equals(request.body._id));
      if (userObj.charityAdmin && charityAdminUpdateRequested) {
        return {
          err: `User ${userObj.email} already is a charity admin for: ${userObj.charityAdmin.code}`
        };
      }
    }

    return {charityAdminUpdateRequested};
  }

  async function updateCharityAdmin(userId, charityId) {
    // removing previous charityAdmins
    await User.update({charityAdmin: charityId}, {
      $set: {charityAdmin: null}
    });
    // setting new charityAdmin
    await User.findByIdAndUpdate(userId, {charityAdmin: charityId});
  }
};
