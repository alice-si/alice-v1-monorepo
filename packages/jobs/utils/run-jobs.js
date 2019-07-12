const ModelUtils = require('../utils/model-utils');

// models loading to avoid problem using populate for entities that refers to project or user entity
ModelUtils.loadModel('project');
ModelUtils.loadModel('user');
ModelUtils.loadModel('charity');
ModelUtils.loadModel('outcome');
ModelUtils.loadModel('category');

const Schedule = require('node-schedule');

const MintingJob = require('../jobs/mintingJob');
const DepositingJob = require('../jobs/depositingJob');
const AccountCreatingJob = require('../jobs/accountCreatingJob');
const ClaimingJob = require('../jobs/ClaimingJob');
const ValidatingJob = require('../jobs/ValidatingJob');
const LinkingJob = require('../jobs/linkingJob');
const PaymentCollectingJob = require('../jobs/paymentCollectingJob');
const ImpactFetchingJob = require('../jobs/impactFetchingJob');
const ProjectDeploymentJob = require('../jobs/projectDeploymentJob');
const MailSenderJob = require('../jobs/mailSendingJob');
const DonationStatusCheckingJob = require('../jobs/donationStatusCheckingJob');

function runJob(job, interval) {
  Schedule.scheduleJob('*/' + interval + ' * * * * *', function () {
    job();
  });
}

function runClassJob(job, interval) {
  Schedule.scheduleJob('*/' + interval + ' * * * * *', function () {
    job.execute();
  });
}

function runQuickJob(job) {
  Schedule.scheduleJob('*/2 * * * * *', function () {
    job();
  });
}

function runDailyJob(job) {
  Schedule.scheduleJob('0 0 8,16 * * *', function () { // runs job every day at 8am
    job();
  });
}

module.exports = function (interval) {

  runJob(AccountCreatingJob.execute, interval);

  runJob(PaymentCollectingJob.execute, interval);

  runJob(ImpactFetchingJob.execute, interval);

  runJob(MintingJob.execute, interval);
  runJob(MintingJob.check, interval);

  runJob(DepositingJob.execute, interval);
  runJob(DepositingJob.check, interval);

  runClassJob(new ClaimingJob(), interval);

  runClassJob(new ValidatingJob(), interval);

  runJob(LinkingJob.execute, interval);
  runJob(LinkingJob.check, interval);

  runJob(ProjectDeploymentJob.execute, interval);

  runQuickJob(MailSenderJob.execute);

  runDailyJob(DonationStatusCheckingJob.execute);
};
