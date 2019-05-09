const TestUtils = require('../utils/test-utils');
const Schedule = require('node-schedule');
const MintingJob = require('../jobs/mintingJob');

async function prepare() {
  await TestUtils.connectToMockDB();
  console.log('Connected to mock DB.');
  await TestUtils.prepareMockObjects('owner', 'COLLECTING_COMPLETED', 'CREATED');
}

function runJob(job, interval) {
  Schedule.scheduleJob('*/' + interval + ' * * * * *', function () {
    job();
  });
}

prepare();

// You can set any job here
runJob(MintingJob.execute, 10);
