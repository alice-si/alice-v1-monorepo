const Moment = require('moment');

const ModelUtils = require('../utils/model-utils');
const config = require('../config');
const Monitor = require('../utils/monitor');
const MailUtils = require('../utils/mail-utils');
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

      this.logger.info('Sending email to devs with: ' + JSON.stringify(aggregatedResult));
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
      $lt: (new Moment()).subtract(config.stalledDonationTimeout, 's').toDate()
    },
    errorChecked: {
      $ne: true
    }
  };
}

module.exports = DonationStatusCheckingJob;
