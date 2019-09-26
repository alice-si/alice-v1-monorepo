const TestUtils = require('../utils/test-utils'); // TestUtils must be included firstly
const ModelUtils = require('../utils/model-utils');
const User = ModelUtils.loadModel('user');
const AccountCreatingJob = require('../jobs/AccountCreatingJob');
const logger = require('../utils/logger')('test/accountCreatingJob');

contract('AccountCreatingJob', async function (accounts) {
  const timeout = 500;
  let user;

  TestUtils.setBeforeAndAfterHooksForJobTest();

  it('should create test model', async function () {
    let mocks = await TestUtils.prepareMockObjects('owner', 'MINTING_COMPLETED', 'CREATED');
    user = mocks.user;
  });

  it('should unset ethAccount for user', async function () {
    let userFound = await User.findOne({_id: user._id});
    userFound.should.not.be.null;
    userFound.ethAccount = null;
    await userFound.save();
  });

  it('Execute accountCreating job', async function () {
    await new AccountCreatingJob().execute();
  });

  it('User should have ethAccount', function (done) {
    setTimeout(async function () {
      let userFound = await User.findOne({_id: user._id});
      logger.debug(userFound);
      userFound.ethAccount.should.not.be.null;
      done();
    }, timeout);
  });
});

