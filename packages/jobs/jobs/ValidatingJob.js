const EthProxy = require('../gateways/ethProxy');
const ModelUtils = require('../utils/model-utils');
const { BlockchainJob } = require('./job');

const Validation = ModelUtils.loadModel('validation');

class ValidatingJob extends BlockchainJob {
  constructor() {
    super('VALIDATING', Validation, 'APPROVED');
  }

  async run(validation) {
    validation = await validation.populate(
      '_projectId').execPopulate();
    let tx = await EthProxy.validateOutcome(
      validation._projectId,
      validation,
      validation._projectId.ethAddresses['validator']);
    return tx;
  }
}

module.exports = ValidatingJob;
