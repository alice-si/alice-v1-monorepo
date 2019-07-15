const JobUtils = require('../utils/job-utils');
const ModelUtils = require('../utils/model-utils');
const Project = ModelUtils.loadModel('project');
const EthProxy = require('../gateways/ethProxy');
const User = ModelUtils.loadModel('user');
const Monitor = require('../utils/monitor');

const startStatus = 'CREATED';

async function mainAction(jobContext) {
  let project = jobContext.model;

  // Checking validator ethAccount
  let validators = await User.find({validator: project._id});
  if (validators.length != 1) {
    throw new Error('Wrong number of validators for project: '
                    + validators.length);
  }
  let validator = validators[0];

  if (!validator.ethAccount) {
    throw new Error('validator does not have an ethAccount: '
                    + validator._id + ' skipping...');
  }

  // Creating ethAccount for charity if needed
  if (!project.charity.ethAccount) {
    jobContext.msg('Charity has no ethAcount. Creating...');
    project.charity.ethAccount = await EthProxy.createNewAddress();
    await project.charity.save();
    jobContext.msg(`Created ethAccount for charity: ${project.charity.ethAccount}`);
  }

  // Project deploying
  let addresses = await EthProxy.deployProject(
    project,
    validator.ethAccount,
    project.charity.ethAccount);
  jobContext.msg('Project was deployed: ' + addresses.lastTx);

  // Saving addresses in DB
  project.ethAddresses = addresses;
  await project.save();
  jobContext.msg('Addresses were saved in DB');

  await jobContext.completedBehaviour();
}

module.exports = JobUtils.createJob({
  model: Project,
  processName: 'PROJECT_DEPLOYMENT',
  createChecker: false,
  modelGetter: function () {
    return Project.findOneAndUpdate({status: startStatus}, {status: 'PROJECT_DEPLOYMENT_STARTED'}).populate('charity').then(function (res) {
      return res;
    });
  },
  action: mainAction
});
