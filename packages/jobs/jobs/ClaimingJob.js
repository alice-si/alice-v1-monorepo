const EthProxy = require('../gateways/ethProxy');
const KeyProxy = require('../gateways/keyProxy');
const ModelUtils = require('../utils/model-utils');
const { BlockchainJob } = require('./job');

const Validation = ModelUtils.loadModel('validation');

class ClaimingJob extends BlockchainJob {
  constructor() {
    super('CLAIMING', Validation, 'CREATED');
  }

  async run(validation) {
    validation =
      await validation.populate('_projectId _claimerId').execPopulate();
    let tx = await EthProxy.claimOutcome(
      validation._projectId, validation);
    return tx;
  }
}

module.exports = ClaimingJob;
