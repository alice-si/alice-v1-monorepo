// To use tests with should
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-shallow-deep-equal'))
  .should();

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
// const Mockgoose = require('mockgoose').Mockgoose;
// const mockgoose = new Mockgoose(Mongoose);
const Express = require('express');
const passport	= require('passport');
const bodyParser = require('body-parser');
const request = require('request-promise');
const rewire = require('rewire');
const Promise = require('bluebird');

const Auth = require('../devServer/service/auth');
const Utils = loadModuleFromDevServer('service/utils');

const Validation = Utils.loadModel('validation');
const Project = Utils.loadModel('project');
const Charity = Utils.loadModel('charity');
const Donation = Utils.loadModel('donation');
const User = Utils.loadModel('user');
const Outcome = Utils.loadModel('outcome');
const Impact = Utils.loadModel('impact');

let app, server, mongoServer;

const TEST_PASS = '_';
const port = 8889;

let TestUtils = function () {};

TestUtils.removeTestDB = async function () {
  mongoose.disconnect();
  await mongoServer.stop();
};

TestUtils.connectToTestDB = async function () {
  mongoServer = new MongoMemoryServer();

  mongoose.Promise = Promise;
  const mongoUri = await mongoServer.getConnectionString();
  const mongooseOpts = {
    useNewUrlParser: true,
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
  };

  await new Promise((resolve, reject) => {
    mongoose.connect(mongoUri, mongooseOpts);

    mongoose.connection.on('error', (e) => {
      reject(e);
    });
  
    mongoose.connection.once('open', () => {
      resolve();
    });
  });
};

TestUtils.getTestUserData = function (email) {
  return {
    email: email,
    residence: 'GB',
    firstName: 'Tom',
    lastName: 'Tester',
    dateOfBirth: new Date('1997-08-22'),
    nationality: 'GB',
    password: TEST_PASS
  };
};

TestUtils.loadController = async function (name, authStubbing = true) {
  let controller = rewire('../devServer/controller/' + name);

  if (authStubbing) {
    let userCreated = await TestUtils.createUser({ superadmin: true });

    const realAuthService = loadModuleFromDevServer('./service/auth');

    // This doesn't work if Alice-Test-User-Email header is used.
    TestUtils.loggedUserId = userCreated._id;

    controller.__set__('Auth', {
      auth: function () {
        return async (req, res, next) => {
          let projects = await Project.find({});
          let idsForAllProjects = projects.map(project => project._id);

          let userEmail = req.headers['alice-test-user-email']
          let testUser =
            userEmail ? await User.findOne({ email: userEmail }) : userCreated;

          req.user = await Utils.getUserDetailsById(testUser._id);

          return next();
        };
      },
      hashPassword: realAuthService.hashPassword,
      getEncryptedRandomKey: realAuthService.getEncryptedRandomKey,
      comparePassword: realAuthService.comparePassword,
      getJWT: realAuthService.getJWT
    });
  }

  return controller;
}

TestUtils.startAppWithController = async function (controller) {
  if (server) {
    await convertToPromise(cb => server.close(cb));
    console.log('Running server was stopped');
  }

  console.log('App starting...');
  app = Express();
  app.use(passport.initialize());
  app.use(bodyParser.json());
  app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      next();
    });
  require('../devServer/passport')(passport);
  server = app.listen(port);

  controller(app);
  console.log("App was started with with controller");

  return app;
};

TestUtils.stopAppWithController = async function (controller) {
  await new Promise((resolve, reject) => {
    server.close(resolve);
  });
};

TestUtils.setBeforeAndAfterHooksForControllerTest = function (controllerName) {
  before(async function() {
    await TestUtils.connectToTestDB();
    console.log('Connected to test DB');
    let controller = await TestUtils.loadController(controllerName);
    await TestUtils.startAppWithController(controller);
  });

  after(async function () {
      await TestUtils.stopAppWithController();
      console.log('Server was stopped');
      await TestUtils.removeTestDB();
      console.log('Test db was reset');
  });
};

/**
 * Perform a POST request against the tested server instance.
 * @param {string} endpoint - name of the endpoint
 * @param {Object|Array} data - request payload
 * @param {function(res: Response): Promise} [callback]
 * @param {User} [user] - user that sends the request, default is a superuser
 * @return {Promise<Response>} HTTP response, if no callback is specified
 */
TestUtils.testPost = async (endpoint, data, callback, user) => {
  let options = {
    method: 'POST',
    url: getEpUrl(endpoint),
    body: data,
    json: true,
  };
  if (user) {
    options.headers = { 'Alice-Test-User-Email': user.email };
  }
  let res = await request(options);

  // TODO migrate all usages to async and remove the parameter.
  if (callback) {
    await callback(res);
  } else {
    return res;
  }
}

/**
 * Perform a GET request against the tested server instance.
 * @param {string} epName - name of the endpoint
 * @param {string} [param=''] - "path" parameter
 * @param {function(res: Response): Promise} [testFunction] - optional callback
 * @param {User} [user] - user that sends the request, default is a superuser
 * @return {Promise<Response>} HTTP response, if no callback specified
 */
TestUtils.testGet = async (epName, param='', testFunction, user) => {
  let options = { url: getEpUrl(epName + '/' + param) };
  if (user) {
    options.headers = { 'Alice-Test-User-Email': user.email };
  };

  let res = await request.get(options);
  res = JSON.parse(res);

  // TODO migrate all usages to async and remove the parameter.
  if (testFunction) {
    await testFunction(res);
  } else {
    return res;
  }
};

// ====================
// Test object creators
// ====================
// The functions below can be used to easily create entities for testing
// filled with default values.
//
// When using them, you should only specify the fields that are relevant
// for the specific test in the last argument (fields object).

let nextCharityIndex = 1;
TestUtils.createCharity = async (
  {
    code = `test-charity-${nextCharityIndex}`,
    name = `Test Charity ${nextCharityIndex}`,
    legalName = `Test Charity ${nextCharityIndex} Ltd`,
  } = {}
) => {
  nextCharityIndex++;
  return await new Charity({ code, name, legalName }).save();
}

let nextProjectIndex = 1;
TestUtils.createProject = async (
  charity,
  {
    code = `test-project-${nextProjectIndex}`,
    title = `Test Project ${nextProjectIndex}`,
    status = 'ACTIVE',
    fundingTarget = 1000,
  } = {}
) => {
  nextProjectIndex++;
  let project = await new Project({
    code,
    title,
    status,
    fundingTarget,
    charity: charity._id,
  }).save();

  charity.projects.push(project._id);
  await charity.save();
  return project;
}

let nextUserIndex = 1;
TestUtils.createUser = async (
  {
    email = `test-user-${nextUserIndex}@alice.si`,
    residence = 'GB',
    firstName = 'Tom',
    lastName = `Tester${nextUserIndex}`,
    dateOfBirth = new Date('1997-08-22'),
    nationality = 'GB',
    password = TEST_PASS,
    ...rest
  } = {}
) => {
  nextUserIndex++;
  let user = await new User(Object.assign({
    email,
    residence,
    firstName,
    lastName,
    dateOfBirth,
    nationality,
    password
  }, rest)).save();

  user.password = await Auth.hashPassword(user.password);
  await user.save();

  return user;
}

TestUtils.createDonation = async (
  user,
  project,
  {
    amount = 100,
    status = 'DONATED',
  } = {}
) => {
  return await new Donation({
    _userId: user._id,
    _projectId: project._id,
    amount,
    status
  }).save();
}

let nextOutcomeIndex = 1;
TestUtils.createOutcome = async (
  project,
  {
    title = `Test outcome ${nextOutcomeIndex}`,
    description = `Test outcome ${nextOutcomeIndex} description`,
    amount = 100,
  } = {}
) => {
  nextOutcomeIndex++;
  let outcome = await new Outcome({
    _projectId: project._id,
    title,
    description,
    amount
  }).save();

  project._outcomes.push(outcome._id);
  await project.save();
  return outcome;
}

TestUtils.createValidation = async (
  outcome,
  {
    amount = 25,
    status = 'CREATED',
    validator = null,
    ...rest
  } = {}
) => {
  let fields = {
    _projectId: outcome._projectId,
    _outcomeId: outcome._id,
    amount,
    status,
  };
  if (validator) {
    fields._validatorId = validator._id;
  }
  Object.assign(fields, rest);
  return await new Validation(fields).save();
}

TestUtils.createImpact = async (
  user,
  validation,
  {
    amount = 25,
  } = {}
) => {
  return await new Impact({
    _userId: user._id,
    _projectId: validation._projectId,
    _outcomeId: validation._outcomeId,
    _validationId: validation._id,
    amount,
  }).save();
}

/**
  * Creates an environment with all kinds of entities.
  *
  * For new tests, prefer using the entity creators explicitly
  * for better test readability.
  */
TestUtils.createTestObjects = async () => {
  let charity = await TestUtils.createCharity();
  let projects = [
    await TestUtils.createProject(charity, { fundingTarget: 1000 }),
    await TestUtils.createProject(charity, { fundingTarget: 2000 }),
  ];
  let users = [
    await TestUtils.createUser(),
    await TestUtils.createUser(),
  ];
  let donations = [
    await TestUtils.createDonation(users[0], projects[0], { amount: 50 }),
    await TestUtils.createDonation(users[1], projects[0], { amount: 100 }),
  ];
  let outcomes = [ await TestUtils.createOutcome(projects[0]) ];
  let validations = [
    await TestUtils.createValidation(outcomes[0], {
      validator: users[1],
      status: 'IMPACT_FETCHING_COMPLETED',
      impact_fetchingTime: new Date(),
    })
  ];
  let impacts = [ await TestUtils.createImpact(users[0], validations[0]) ];

  return { projects, users, donations, validations, outcomes, impacts, charity };
};

TestUtils.loadModuleFromDevServer = loadModuleFromDevServer;

function loadModuleFromDevServer(path) {
  return require('../devServer/' + path);
}

function getEpUrl(name) {
  return 'http://localhost:' + port + '/api/' + name;
};

function convertToPromise(functionWithCallback) {
  return new Promise(function (resolve, reject) {
    functionWithCallback(resolve);
  });
}

module.exports = TestUtils;
