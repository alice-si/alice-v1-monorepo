const ModelUtils = require('../utils/model-utils');
const Promise = require('bluebird');
const RunJobs = require('../utils/run-jobs');
const Schedule = require('node-schedule');
const TestConfig = require('../test-config');
const TestUtils = require('../utils/test-utils');
const EthProxy = require('../gateways/ethProxy.js');

const Donation = ModelUtils.loadModel('donation');
const Project = ModelUtils.loadModel('project');
const Validation = ModelUtils.loadModel('validation');

const numberOfUsers = 10;
const interval = 1; // second

TestUtils.connectToMockDB().then(async function () {
  await TestUtils.prepareMockObjectsForLoadTest(numberOfUsers);
  RunJobs(interval);

  let validationsWereCreated = false;
  Schedule.scheduleJob('*/1 * * * * *', async () => {
    console.log("Searching for donated donations started...");

    let project = await Project.findOne({});
    let donationsDonated = await Donation.find({status: 'DONATED'});

    if (donationsDonated.length == numberOfUsers && !validationsWereCreated) {
      console.log("All donations have DONATED status - validations creating started...");

      // transfer some ether to claimer so he can pay for transaction
      await EthProxy.loadAccount(project.ethAddresses['beneficiary']);

      await TestUtils.createMockValidations();
      validationsWereCreated = true;
    } else {
      if (!validationsWereCreated) {
        console.log("Not all donations have DONATED status yet - skipping...");
      }
    }
  });

  let validationsWereApproved = false;
  Schedule.scheduleJob('*/1 * * * * *', async () => {
    if (validationsWereApproved) return;

    let validationsClaimed =
      await Validation.find({ status: 'CLAIMING_COMPLETED' });
    if (validationsClaimed.length == numberOfUsers) {
      console.log(
        'All validations have CLAIMING_COMPLETED status - approving started..');
      for (let validation of validationsClaimed) {
        validation.status = 'APPROVED';
        await validation.save();
      }
      validationsWereApproved = true;
    } else {
      console.log(
        'Not all validations have CLAIMING_COMPLETED status yet - skipping...');
    }
  });
});
