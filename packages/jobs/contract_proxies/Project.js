const ContractUtils = require('../utils/contract-utils');

const ImpactRegistry = require('./ImpactRegistry');
const { createProxy } = require('./BaseProxy');

const Project = createProxy('Project');

module.exports = Object.assign(Project, {
  getAllContractsForDocument: async (project) => {
    let projectContract = await Project.at(getAddress(project, 'project'));
    let impactRegistryContract =
      await ImpactRegistry.at(getAddress(project, 'impact'));
    let tokenContract = ContractUtils.getContractInstance(
      ContractUtils.AliceToken, getAddress(project, 'token'));

    return {
      project: projectContract,
      token: tokenContract,
      impactRegistry: impactRegistryContract
    };
  }
});

function getAddress(project, name) {
  if (project && project.ethAddresses && project.ethAddresses[name]) {
    return project.ethAddresses[name];
  } else {
    throw 'Project: ' + JSON.stringify(project) +
          ' doesn\'t have address for field: ' + name;
  }
}
