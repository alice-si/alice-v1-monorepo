const EthProxy = require('../gateways/ethProxy');
const MailUtils = require('../utils/mail-utils');
const ModelUtils = require('../utils/model-utils');
const { ModelJob } = require('./job');

const Validation = ModelUtils.loadModel('validation');
const User = ModelUtils.loadModel('user');
const Impact = ModelUtils.loadModel('impact');

class ImpactFetchingJob extends ModelJob {
  constructor() {
    super('IMPACT_FETCHING', Validation, 'LINKING_COMPLETED');
  }

  async run(validation) {
    validation = await validation.populate(
      '_projectId _validatorId').execPopulate();
    let validationIdStr = validation._id.toString();
    let project = await validation._projectId.populate('charity').execPopulate();
    
    this.logger.info(`Fetching impact for validation: ${validationIdStr}`);

    let impacts = await EthProxy.fetchImpact(project, validationIdStr);

    for (let impact of impacts) {
      let user = await User.findOne({ethAccount: impact.donor});
      if (!user) {
        throw new Error(`There are no users with ethAccount: ${impact.donor}`);
      }

      // Saving a new impact
      let savedImpact = await new Impact({
        _projectId: project._id,
        _outcomeId: validation._outcomeId,
        _userId: user._id,
        _validationId: validation._id,
        amount: impact.value
      }).save();
      this.logger.info(
        `Impact fetched for validation: ${validation._id} impactId: ${savedImpact._id}`);

      // Sending email to donor
      await MailUtils.sendImpactConfirmation(user, project, savedImpact);
    }

  }
}

module.exports = ImpactFetchingJob;
