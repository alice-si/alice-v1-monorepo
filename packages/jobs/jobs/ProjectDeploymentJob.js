const EthProxy = require('../gateways/ethProxy');
const ModelUtils = require('../utils/model-utils');
const { ModelJob } = require('./job');

const Project = ModelUtils.loadModel('project');
const User = ModelUtils.loadModel('user');

class ProjectDeploymentJob extends ModelJob {
  constructor() {
    super('PROJECT_DEPLOYMENT', Project, 'CREATED');
  }

  async run(project) {
    project = await project.populate('charity').execPopulate();

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
      this.logger.info('Charity has no ethAcount. Creating...');
      project.charity.ethAccount = await EthProxy.createNewAddress();
      await project.charity.save();
      this.logger.info(
        `Created ethAccount for charity: ${project.charity.ethAccount}`);
    }

    // Project deploying
    let addresses = await EthProxy.deployProject(
      project,
      validator.ethAccount,
      project.charity.ethAccount);
    this.logger.info('Project was deployed: ' + addresses.lastTx);

    // Saving addresses in DB
    project.ethAddresses = addresses;
    await project.save();
    this.logger.info('Addresses were saved in DB');
  }
}

module.exports = ProjectDeploymentJob;
