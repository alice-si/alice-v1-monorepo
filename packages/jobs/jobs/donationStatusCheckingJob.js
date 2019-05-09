const JobUtils = require('../utils/job-utils');
const ModelUtils = require('../utils/model-utils');
const Donation = ModelUtils.loadModel('donation');
const MailUtils = require('../utils/mail-utils');
const Monitor = require('../utils/monitor');
const Moment = require('moment');
const Config = require('../config');

function mainAction(jobContext) {
  let aggregatedResult, donations;
  return Donation.findOne(getFilter()).then(function (donation) {
    if (donation) {
      jobContext.msg('Donation statuses are not correct!');
      return Monitor.getAggregatedResult(Donation);
    } else {
      return Promise.resolve();
    }
  }).then(function (result) {
    jobContext.msg('Fetched aggregated result');
    aggregatedResult = result;
    return Donation.find(getFilter(), 'createdAt amount status type')
      .sort({createdAt: 'desc'})
      .populate('_userId', 'email');
  }).then(function (result) {
    jobContext.msg('Fetched stalled donations data');
    donations = result;
    if (donations && donations.length > 0) {
      jobContext.msg('Sending email to devs with Donation: ' + JSON.stringify(result));
      return MailUtils.sendStalledDonationsNotification(aggregatedResult, donations);
    } else {
      return Promise.resolve();
    }
  }).then(function () {
    return jobContext.completedBehaviour();
  }).catch(function (err) {
    jobContext.errorBehaviour(err);
  });
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

module.exports = JobUtils.createJob({
  processName: 'DONATION_STATUS_CHECKING',
  modelless: true,
  action: mainAction
});