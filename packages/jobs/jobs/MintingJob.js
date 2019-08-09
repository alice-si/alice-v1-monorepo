const EthProxy = require('../gateways/ethProxy');
const ModelUtils = require('../utils/model-utils');
const { BlockchainJob } = require('./job');

const Donation = ModelUtils.loadModel('donation');

class MintingJob extends BlockchainJob {
  constructor() {
    super('MINTING', Donation, 'COLLECTING_COMPLETED');
  }

  async run(donation) {
    donation =
      await donation.populate('_projectId').execPopulate();
    let tx = await EthProxy.mint(donation._projectId, donation.amount);
    return tx;
  }
}

module.exports = MintingJob;
