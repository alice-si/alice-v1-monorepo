const TestUtils = require('../utils/test-utils');
const ModelUtils = require('../utils/model-utils');
const ProjectDeploymentJob = require('../jobs/ProjectDeploymentJob');
const Project = ModelUtils.loadModel('project');
const User = ModelUtils.loadModel('user');
const Charity = ModelUtils.loadModel('charity');
const TestConfig = require('../test-config');
const KeyProxy = require('../gateways/keyProxy');

contract('ProjectDeploymentJob', async function (accounts) {
  const code = 'TEST_FOR_PRJ_DEPLOY';
  let project, charityAdmin, validator, charity;

  TestUtils.setBeforeAndAfterHooksForJobTest();

  it('Should create new objects', async function () {
    charity = await new Charity({code: 'charityCodeForTests'}).save();

    let defaultCrypto = KeyProxy.encrypt(TestConfig.defaultPassword);
    charityAdmin = await new User({
      charityAdmin: charity._id,
      email: 'charityAdmin123@gmail.com',
      ethAccount: accounts[2],
      crypto: defaultCrypto
    }).save();

    // Project creating
    project = await new Project({
      code: code,
      upfrontPayment: 20,
      charity: charity._id,
      status: 'CREATED',
    }).save();

    // Validator creating
    validator = await new User({
      validator: [project._id],
      ethAccount: accounts[3],
      email: 'validator123@gmail.com'
    }).save();

  });

  it('Should execute projectDeploymentJob', async function () {
    await new ProjectDeploymentJob().execute();
  });

  it('Project should have status PROJECT_DEPLOYMENT_COMPLETED', async () => {
    await TestUtils.testStatus(
      Project, 'PROJECT_DEPLOYMENT_COMPLETED', project._id);
  });
});
