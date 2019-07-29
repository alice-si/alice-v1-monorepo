const ModelUtils = require('../utils/model-utils');
const RunJobs = require('../utils/run-jobs');
const Schedule = require('node-schedule');
const TestUtils = require('../utils/test-utils');
const EthProxy = require('../gateways/ethProxy.js');
const ProjectDeploymentJob = require('../jobs/ProjectDeploymentJob');

const Donation = ModelUtils.loadModel('donation');
const Project = ModelUtils.loadModel('project');
const Validation = ModelUtils.loadModel('validation');

const numberOfUsers = 1;
const interval = 1; // second

TestUtils.connectToMockDB().then(async function () {
  await TestUtils.prepareMockObjectsForLoadTest(numberOfUsers);
  // Project should be deployed before other jobs running
  await new ProjectDeploymentJob().execute();
  RunJobs(interval);

  let validationsWereCreated = false;
  Schedule.scheduleJob('*/1 * * * * *', async () => {
    console.log('Searching for donated donations started...');

    let project = await Project.findOne({});
    let donationsDonated = await Donation.find({status: 'DONATED'});

    if (donationsDonated.length == numberOfUsers && !validationsWereCreated) {
      console.log('All donations have DONATED status - validations creating started...');

      await TestUtils.createMockValidations();
      validationsWereCreated = true;
    } else {
      if (!validationsWereCreated) {
        console.log('Not all donations have DONATED status yet - skipping...');
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
