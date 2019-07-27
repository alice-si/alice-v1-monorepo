const EthProxy = require('../gateways/ethProxy');
const ModelUtils = require('../utils/model-utils');
const { BlockchainJob } = require('./job');

const Donation = ModelUtils.loadModel('donation');

class DepositingJob extends BlockchainJob {
  constructor() {
    super('DEPOSITING', Donation, 'MINTING_COMPLETED');
  }

  completedStatus() {
    return 'DONATED';
  }

  async run(donation) {
    donation =
      await donation.populate('_projectId _userId').execPopulate();

    let userAccount = donation._userId.ethAccount;
    if (!userAccount) {
      this.logger.warn('Missing user account for user: '
                      + JSON.stringify(donation._userId));
      return await ModelUtils.changeStatus(donation, startStatus);
    }

    let tx = await EthProxy.deposit(
      userAccount, donation._projectId, donation.amount);

    return tx;
  }
}

module.exports = DepositingJob;
