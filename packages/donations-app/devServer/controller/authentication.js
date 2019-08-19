const asyncHandler = require('express-async-handler');

const Utils = require('../service/utils');
const Mail = require('../service/mail');
const Mango = require('../service/mango');
const Random = require('../service/random');
const Validator = require('validator');
const Auth = require('../service/auth');
const Moment = require('moment');
const Lodash = require('lodash');
const AccessControl = require('../service/access-control');
const User = Utils.loadModel('user');
const AccessRequest = Utils.loadModel('accessRequest');
const Charity = Utils.loadModel('charity');

const ACCESS_REQUEST_TTL = 120; // seconds
const JWT_OAUTH_TTL = 300; // seconds
const DEFAULT_RESIDENCE = "GB";
const DEFAULT_NATIONALITY = "GB";
const DEFAULT_BIRTHDAY = new Date(0);
const TEMP_FIRST_NAME = "Donor";
const TEMP_LAST_NAME = "Unregistered";

module.exports = function (app) {

  app.post('/api/signup', asyncHandler(async (req, res) => {
    const newUser = await signUp(req.body, true);
    return res.json({ userId: newUser._id });
  }));

  // Function to save so called simple user
  // Simple user has email, mango account, mango wallet (and doesn't have a password)
  // Simple user allows making donations without signing up
  app.post('/api/registerEmail', asyncHandler(async (req, res) => {
    const existingUser = await User.findOne({
      email: new RegExp('^' + req.body.email, 'i')
    });
    let user;
    if (!existingUser) {
      user = await signUp(req.body, false);
    } else if (existingUser.isSimpleUser) {
      user = existingUser;
    } else {
      return res.status(403).json('Passed email requires authentication');
    }
    // Jwt token creation
    const token = Auth.getJWT(user._id, {scope: 'donations_only'});
    return res.json({token});
  }));

  // It works in the same way as '/api/registerEmail'
  // But it returns JWT tokens for full users as well
  app.post('/api/getTokenForAnonymousDonation', asyncHandler(async (req, res) => {
    const existingUser = await User.findOne({
      email: new RegExp('^' + req.body.email, 'i')
    });
    let user;
    if (!existingUser) {
      user = await signUp(req.body, false);
    } else {
      user = existingUser;
    }
    // Jwt token creation
    const token = Auth.getJWT(user._id, {scope: 'donations_only'});
    return res.json({token});
  }));

  app.post('/api/authenticate', asyncHandler(async (req, res) => {
      const user = await User.findOne({
        email: new RegExp('^' + req.body.email, 'i')
      });
      if (!user) {
        return res.status(400).json('Authentication failed. User was not found.');
      }
      const passwordsMatch = await Auth.comparePassword(user, req.body.password);
      if (!passwordsMatch) {
        return res.status(401).json('Authentication failed. Wrong password.');
      }
      const token = Auth.getJWT(user._id, {scope: 'full_access'});
      return res.json({token});
  }));

  app.post(
    '/api/authenticateAsAnotherUser',
    Auth.auth(),
    AccessControl.Middleware.isSuperadmin,
    asyncHandler(async (req, res) => {
      const user = await User.findOne({
        email: new RegExp('^' + req.body.email, 'i')
      });
      if (!user) {
        return res.status(400).json('Authentication failed. User was not found.');
      }
      // TODO - maybe we should disable access to endpoints for making claims and validations
      const token = Auth.getJWT(user._id, {scope: 'full_access'});
      return res.json({token});
  }));

  app.post('/api/resetPassword', asyncHandler(async (req, res) => {
    const user = await User.findOne({email: new RegExp('^' + req.body.email, 'i')});
    if (!user) {
      return res.status(400).json("Email: " + req.body.email + " hasn't been found on our platform.");
    }
    user.passwordChangeToken = Random.randomLetters(32);
    const savedUser = await user.save();
    await Mail.sendPasswordReset(savedUser);
    return res.json("Password reset sent to: " + savedUser.email);
  }));

  app.post('/api/changePassword', asyncHandler(async (req, res) => {
    if (!Validator.isAlpha(req.body.passwordChangeToken.toString())) {
      return res.status(404).json("Wrong token format");
    }

    const user = await User.findOne({passwordChangeToken: req.body.passwordChangeToken});
    if (!user) {
      return res.status(400).json("Password change link has expired or is corrupted.");
    }

    user.password = await Auth.hashPassword(req.body.password);
    user.passwordChangeToken = undefined;
    await user.save();

    return res.json("Password change request registered."
      + " We will notify you by email when the process is complete.");
  }));

  app.post('/api/oauth2/requestAccessCode', Auth.auth(), asyncHandler(async (req, res) => {
    // TODO we should make api params validation better
    if (!req.body || !req.body.redirectUrl || !req.body.charityId || !req.body.scope) {
      return res.status(400).send(`Invalid params in request body: ${JSON.stringify(req.body)}`);
    }
    const charity = await Charity.findById(req.body.charityId);
    const urlAllowed = charity.allowedRedirectUrls
      .find(allowedUrl => req.body.redirectUrl.startsWith(allowedUrl));
    if (!urlAllowed) {
      return res.status(400).send(`Url is not allowed for the charity: ${req.body.charityId}`);
    }
    const accessCode = Random.randomLetters(64);
    await new AccessRequest({
      _userId: req.user._id,
      accessCode: accessCode,
      scope: req.body.scope,
      createdAt: Date.now()
    }).save();
    return res.json({accessCode});
  }));

  app.post('/api/oauth2/getAccessToken', asyncHandler(async (req, res) => {
    const accessCode = req.body.accessCode;
    const accessRequest = await AccessRequest.findOne({accessCode});
    if (!accessRequest) {
      return res.status(400).json(`Access code is invalid: ${accessCode}`);
    }
    if (Moment(accessRequest.createdAt).add(ACCESS_REQUEST_TTL, 'seconds')
      .isBefore(Moment(Date.now()))) {
        return res.status(400).json(`Access request was expired ${accessRequest._id}`);
    }
    const token = Auth.getJWT(accessRequest._userId, {
      expiresIn: JWT_OAUTH_TTL,
      scope: accessRequest.scope
    });
    return res.json({token});
  }));

  /* This function handles 3 cases:
    - registering a new simple user
    - registering a new full user
    - finishing registration for a simple user
  */
  async function signUp(userBody, isFullUser) {
    const existingUser = await User.findOne({
      email: new RegExp('^' + userBody.email, 'i')
    });

    if (existingUser && !existingUser.isSimpleUser) {
      throw `Email ${userBody.email} is already registered.`;
    }

    // preparing user's fields
    const selectedUserFields = Lodash.pick(userBody, [
      'email',
      'password',
      'firstName',
      'lastName',
      'nationality',
      'residence',
      'registeredAt',
      'dateOfBirth',
      'agreeContact',
      'giftAid',
      'agreeAlice',
      'address1',
      'address2',
      'city',
      'postCode'
    ]);
    let unsavedUser;
    if (existingUser) {
      unsavedUser = existingUser;
      Object.assign(unsavedUser, selectedUserFields);
    } else {
      unsavedUser = new User(selectedUserFields);
    }

    unsavedUser.superadmin = false;
    if (unsavedUser.residence != 'GB') {
      unsavedUser.giftAid = false;
    }
    if (isFullUser) {
      unsavedUser.isSimpleUser = false;
    } else {
      unsavedUser.isSimpleUser = true;
      // Mangopay requires these fields not to be empty
      unsavedUser.firstName = TEMP_FIRST_NAME;
      unsavedUser.lastName = TEMP_LAST_NAME;
    }

    // Setting default values
    unsavedUser.dateOfBirth = DEFAULT_BIRTHDAY;
    unsavedUser.nationality = DEFAULT_NATIONALITY;
    unsavedUser.residence = DEFAULT_RESIDENCE;

    // registering mango wallet and user
    if (!unsavedUser.mangoWalletId || !unsavedUser.mangoUserId) {
      unsavedUser = await Mango.registerUser(unsavedUser);
    }
    if (unsavedUser.password) {
      unsavedUser.password = await Auth.hashPassword(unsavedUser.password);
    }
    if (!unsavedUser.crypto) {
      // setting crypto for new users
      unsavedUser.crypto = await Auth.getEncryptedRandomKey();
    }

    const savedUser = await unsavedUser.save();

    // Sending an email
    if (isFullUser) {
      await Mail.sendAccountConfirmation(savedUser);
    } else {
      await Mail.sendAliceInvitation(savedUser);
    }

    return savedUser;
  }
};
