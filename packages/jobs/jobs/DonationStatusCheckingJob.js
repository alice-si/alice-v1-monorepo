const ModelUtils = require('../utils/model-utils');
const Moment = require('moment');
const { BasicJob } = require('./job');

const Donation = ModelUtils.loadModel('donation');

class DonationStatusCheckingJob extends BasicJob {
  constructor() {
    super('DONATION_STATUS_CHECKING');
  }

  async run() {
    let uncheckedStalledDonationsExist = await Donation.findOne(getFilter());
    if (uncheckedStalledDonationsExist) {
      this.logger.warn('Donation statuses are not correct!');

      let aggregatedResult = await Monitor.getAggregatedResult(Donation);
      let stalledDonations = await Donation.find(getFilter(), 'createdAt amount status type')
          .sort({createdAt: 'desc'})
          .populate('_userId', 'email');

      this.logger.info('Sending email to devs with Donation: ' + JSON.stringify(result));
      await MailUtils.sendStalledDonationsNotification(
        aggregatedResult, stalledDonations);
    }
  }
}

function getFilter() {
  return {
    status: {
      $nin: ['DONATED', 'BANK_TRANSFER_REQUESTED']
    },
    createdAt: {
      $lt: (new Moment()).subtract(Config.stalledDonationTimeout, 's').toDate()
    },
    errorChecked: {
      $ne: true
    }
  };
}

module.exports = DonationStatusCheckingJob;
