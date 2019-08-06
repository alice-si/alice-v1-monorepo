const ModelUtils = require('../utils/model-utils');

// models loading to avoid problem using populate for entities that refers to project or user entity
ModelUtils.loadModel('project');
ModelUtils.loadModel('user');
ModelUtils.loadModel('charity');
ModelUtils.loadModel('outcome');
ModelUtils.loadModel('category');

const Schedule = require('node-schedule');

const MintingJob = require('../jobs/MintingJob');
const DepositingJob = require('../jobs/DepositingJob');
const AccountCreatingJob = require('../jobs/AccountCreatingJob');
const ClaimingJob = require('../jobs/ClaimingJob');
const ValidatingJob = require('../jobs/ValidatingJob');
const LinkingJob = require('../jobs/LinkingJob');
const PaymentCollectingJob = require('../jobs/PaymentCollectingJob');
const ImpactFetchingJob = require('../jobs/ImpactFetchingJob');
const ProjectDeploymentJob = require('../jobs/ProjectDeploymentJob');
const MailSenderJob = require('../jobs/MailSendingJob');
const DonationStatusCheckingJob = require('../jobs/DonationStatusCheckingJob');

function runJob(job, interval) {
  Schedule.scheduleJob('*/' + interval + ' * * * * *', function () {
    job.execute();
  });
}

function runDailyJob(job) {
  Schedule.scheduleJob('0 0 8,16 * * *', function () { // runs job every day at 8am and 4pm
    job.execute();
  });
}

module.exports = function (interval) {

  jobs = [
    AccountCreatingJob,
    PaymentCollectingJob,
    ImpactFetchingJob,
    MintingJob,
    DepositingJob,
    ClaimingJob,
    ValidatingJob,
    LinkingJob,
    ProjectDeploymentJob,
    MailSenderJob
  ];

  for (let job of jobs) {
    runJob(new job(), interval);
  }

  runDailyJob(new DonationStatusCheckingJob());
};
