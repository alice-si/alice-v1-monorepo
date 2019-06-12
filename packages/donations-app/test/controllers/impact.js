const TestUtils = require('../test-utils');
const Utils = TestUtils.loadModuleFromDevServer('service/utils');
const Donation = Utils.loadModel('donation');
const Impact = Utils.loadModel('impact');
const Outcome = Utils.loadModel('outcome');

describe('ImpactController', function () {
    let objects, outcome;

    TestUtils.setBeforeAndAfterHooksForControllerTest({
        name: 'impact'
    });

    it('Should create test objects', async function () {
        objects = await TestUtils.createTestObjects();
        const userId = TestUtils.loggedUserId;
        const projectId = objects.projects[0]._id;
        donation = await new Donation({
            _projectId: projectId,
            _userId: userId,
            amount: 100
        }).save();
        outcome = await new Outcome({
            title: 'testOutcome',
            amount: 100
        }).save();
        impact = await new Impact({
            _projectId: projectId,
            amount: 375,
            _userId: userId,
            _outcomeId: outcome._id
        }).save();
    });

    it('Should get my projects', function () {
        return TestUtils.testGet('getMyProjects', '', async function (res) {
            res.length.should.be.equal(1);
            res[0].donatedByAll.should.be.equal(250);
            res[0].totalDonated.should.be.equal(100);
            res[0].impacts.length.should.be.equal(1);
            res[0].impacts[0].should.be.shallowDeepEqual({
                total: 375,
                count: 1,
                title: 'testOutcome'
            });
        });
    });
});