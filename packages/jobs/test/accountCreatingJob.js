const TestUtils = require('../utils/test-utils');
const ModelUtils = require('../utils/model-utils');
const User = ModelUtils.loadModel('user');
const AccountCreatingJob = require('../jobs/accountCreatingJob');

contract('AccountCreatingJob', async function (accounts) {
  const timeout = 500;
  let user;

  TestUtils.setBeforeAndAfterHooksForJobTest();

  it('should create test model', async function () {
    let mocks = await TestUtils.prepareMockObjects('owner', 'MINTING_COMPLETED', 'CREATED');
    user = mocks.user;
  });

  it('user should be found', async function () {
    let userFound = await User.findOne({_id: user._id});
    userFound.should.not.be.null;
  });

  it('Execute accountCreating job', async function () {
    await AccountCreatingJob.execute();
  });

  it('User should have ethAccount', function (done) {
    setTimeout(async function () {
      let userFound = await User.findOne({_id: user._id});
      console.log(userFound);
      userFound.ethAccount.should.not.be.null;
      done();
    }, timeout);
  });
});

