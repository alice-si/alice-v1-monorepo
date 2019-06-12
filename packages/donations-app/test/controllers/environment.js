const TestUtils = require('../test-utils');
const Utils = TestUtils.loadModuleFromDevServer('service/utils');
const Environment = Utils.loadModel('environment');
const config = require('../../config');

describe('EnvironmentController', function () {
    const urls = ['http://test.alice.si', 'http://test2.alice.si'];

    TestUtils.setBeforeAndAfterHooksForControllerTest({
      name: 'environment',
      rewireVars: {
        config: Object.assign(config, { mode: 'stage' })
      }
    });

    it('Should get environments - empty collection', async function () {
      await TestUtils.testGet('environments', '', function (res) {
        res.length.should.be.equal(0);
      });
    });

    it('Should add environment', async function () {
      await TestUtils.testPost('saveEnvironment', {url: urls[0]}, async function (res) {
        res._id.should.not.be.empty;
        res.url.should.be.equal(urls[0]);
        const envInDb = await Environment.findOne({});
        envInDb._id.should.not.be.empty;
      });
    });

    it('Should not add environment - same url', async function () {
      await TestUtils.testPost('saveEnvironment', {
        url: urls[0]
      }).should.be.rejectedWith(400);
    });

    it('Should not add environment - bad url', async function () {
      const badUrl = 'http://test3.notalice.si';
      await TestUtils.testPost('saveEnvironment', {
        url: badUrl
      }).should.be.rejectedWith(400);
    });

    it('Should find 1 environment', async function () {
      await TestUtils.testGet('environments', '', function (res) {
        res.length.should.be.equal(1);
      });
    });

    it('Should add new environment', async function () {
      await TestUtils.testPost('saveEnvironment', {url: urls[1]}, function (res) {
        res._id.should.not.be.empty;
        res.url.should.be.equal(urls[1]);
      });
    });

    it('Should find all environments', async function () {
      await TestUtils.testGet('environments', '', function (res) {
        res.length.should.be.equal(2);
      });
    });
});