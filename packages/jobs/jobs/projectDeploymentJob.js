const JobUtils = require('../utils/job-utils');
const ModelUtils = require('../utils/model-utils');
const Project = ModelUtils.loadModel('project');
const EthProxy = require('../gateways/ethProxy');
const KeyProxy = require('../gateways/keyProxy');
const User = ModelUtils.loadModel('user');
const Monitor = require('../utils/monitor');

const startStatus = 'CREATED';

// TODO we need to refactor this job using async/await mechanism
function mainAction(jobContext) {
  let project = jobContext.model;
  let validator, charityAdmin;

  // getting validator
  return User.find({validator: project._id}).then(function (validators) {
    if (validators.length != 1) {
      return jobContext.errorBehaviour('Wrong number of validators for project: ' + validators.length);
    }
    validator = validators[0];
    if (!validator.ethAccount) {
      jobContext.msg('validator does not have an ethAccount: ' + validator._id + ' skipping...');
      return ModelUtils.changeStatus(project, startStatus);
    }

    // getting charityAdmin
    return User.find({charityAdmin: project.charity._id});
  }).then(async function (charityAdmins) {
    if (charityAdmins.length != 1) {
      return jobContext.errorBehaviour('Wrong number of charityAdmins for project: ' + charityAdmins.length);
    }
    charityAdmin = charityAdmins[0];
    // if (!charityAdmin.crypto) {
    //   return jobContext.errorBehaviour('Charity admin does not have crypto');
    // }

    // let charityAdminPassword = KeyProxy.decrypt(charityAdmin.crypto);
    // creating an ethAccount for charity
    if (project.charity.ethAccount) {
      jobContext.msg('Charity already has ethAccount: ' + project.charity.ethAccount);
      return Promise.resolve(project.charity.ethAccount);
    } else {
      // return EthProxy.createAccount(charityAdminPassword);
      // TODO - think about potential problems of using charityAdmin's ethAccount
      return Promise.resolve(charityAdmin.ethAccount);
    }
  }).then(function (address) {
    if (address != project.charity.ethAccount) {
      project.charity.ethAccount = address;
      jobContext.msg('Created account for charity with address: ' + address);
    }
    return project.charity.save();
  }).then(function () {
    return EthProxy.deployProject(project, validator.ethAccount, project.charity.ethAccount);
  }).then(function (addresses) {
    jobContext.msg('Project was deployed: ' + addresses.lastTx);
    project.ethAddresses = addresses;
    return project.save();
  }).then(function () {
    jobContext.msg('Addresses were saved in DB');
    return jobContext.completedBehaviour();
  }).catch(function (err) {
    return jobContext.errorBehaviour(err);
  });
}

module.exports = JobUtils.createJob({
  model: Project,
  processName: 'PROJECT_DEPLOYMENT',
  createChecker: false,
  modelGetter: function () {
    return Project.findOneAndUpdate({status: startStatus}, {status: 'PROJECT_DEPLOYMENT_STARTED'}).populate('charity').then(function (res) {
      Monitor.printStatus(Project);
      return res;
    });
  },
  action: mainAction
});
