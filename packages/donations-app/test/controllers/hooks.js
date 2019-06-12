const TestUtils = require('../test-utils');
const Utils = TestUtils.loadModuleFromDevServer('service/utils');
const Environment = Utils.loadModel('environment');
const config = require('../../config');

// This test only tests payInFailed and payInSucceeded endpoint
// from donation controller in stage mode
// these eps in stage mode should redirect
// requests to all exp environments
describe('DonationController - Mangopay Hooks', function () {

    TestUtils.setBeforeAndAfterHooksForControllerTest({
        name: 'donation',
        config: Object.assign(config, { mode: 'stage' })
    });
    
    it('Should create 2 exp environments', async function () {
      await new Environment({
        url: 'http://alextest.alice.si'
      }).save();
      await new Environment({
        url: 'http://asdsadsadsadasasdasdasdasd.com'
      }).save();
    });

    it('Should get donations', async function () {
      await TestUtils.testGet('payInSucceeded', '', function (res) {
        console.log(res);
      });
    });
});