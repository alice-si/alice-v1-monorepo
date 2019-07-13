const EthProxy = require('../gateways/ethProxy');
const KeyProxy = require('../gateways/keyProxy');
const ModelUtils = require('../utils/model-utils');
const { BlockchainJob } = require('./job');

const Validation = ModelUtils.loadModel('validation');

class ValidatingJob extends BlockchainJob {
  constructor() {
    super('VALIDATING', Validation, 'APPROVED');
  }

  async run(validation) {
    validation = await validation.populate(
      '_projectId _validatorId').execPopulate();
    let tx = await EthProxy.validateOutcome(
      validation._projectId,
      validation,
      validation._validatorId.ethAccount);
    return tx;
  }
}

module.exports = ValidatingJob;
