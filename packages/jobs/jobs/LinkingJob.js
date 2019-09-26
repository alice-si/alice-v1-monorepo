const EthProxy = require('../gateways/ethProxy');
const ModelUtils = require('../utils/model-utils');
const { BlockchainJob } = require('./job');

const Validation = ModelUtils.loadModel('validation');

class LinkingJob extends BlockchainJob {
  constructor() {
    super('LINKING', Validation, 'APPROVED');
  }

  async findReady() {
    return await Validation.findOneAndUpdate({
      status: ['LINKING_STEP_COMPLETED', 'VALIDATING_COMPLETED']
    }, {
      status: 'LINKING_STARTED',
    });
  }

  completedStatus() {
    return 'LINKING_STEP_COMPLETED';
  }

  canReturnEmptyTx() {
    return true;
  }

  async run(validation) {
    validation = await validation.populate(
      '_projectId _validatorId').execPopulate();
    let validationIdStr = validation._id.toString();
    let project = validation._projectId;

    this.logger.info(`Linking impact for validation:  ${validationIdStr}`);

    let linkedAmount = await EthProxy.getImpactLinked(
      project, validationIdStr);
    this.logger.info(
      `Currently linked: ${linkedAmount} of: ${validation.amount}`);

    if (linkedAmount > validation.amount) {
      throw new Error(
        `Linked amount is greater than validation amount: ${validationIdStr}`);
    } else if (linkedAmount == validation.amount) {
      this.logger.info(
        `All impact linked for validation: ${validationIdStr}`);
      await ModelUtils.changeStatus(validation, 'LINKING_COMPLETED');
    } else {
      let linkingTx = await EthProxy.linkImpact(project, validationIdStr);
      validation.linkingTransactions.push(linkingTx);
      await validation.save();
      return linkingTx;
    }
  }
}

module.exports = LinkingJob;
