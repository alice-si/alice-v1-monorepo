const TestUtils = require('../test-utils');

// TODO in future we can add more tests for fields evaluated in queries
describe('DashboardController', async function () {
    let objects;

    TestUtils.setBeforeAndAfterHooksForControllerTest({
        name: 'dashboard'
    });

    it('Should create objects', async function () {
        objects = await TestUtils.createTestObjects();
    });

    it('Should get projects', async function () {
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        await sleep(1000);
        await TestUtils.testGet('getProjectsForMain', '', async function (res) {
            res[0].donated.should.be.equal(150);
            res[0].received.should.be.equal(25);
        });
    });

    it('Should get donations for projects', function () {
        return TestUtils.testGet('getDonationsForProjects', '', async function (res) {
            res[0].donations[0].amount.should.be.equal(50);
            res[0].donations[1].amount.should.be.equal(100);
        });
    });

    it('Should get goals for projects', function () {
        return TestUtils.testGet('getGoalsForProjects', '', async function (res) {
            res.length.should.be.equal(2);
            res[0].outcomes[0]._id.should.be.equal(objects.outcomes[0]._id.toString());
        });
    });
});
