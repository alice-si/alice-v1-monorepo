const TestUtils = require('../test-utils');

// TODO maybe we should add more tests for this controller in future
// Currently we have no tests for EPs: sendDonation, securityReturn, checkDonationStatus, preRegisterCard
describe('DonationController', function () {
    let objects;

    TestUtils.setBeforeAndAfterHooksForControllerTest('donation');
    
    it('Should create objects', async function () {
        objects = await TestUtils.createTestObjects();
    });

    it('Should get donations', function () {
        return TestUtils.testGet('getDonations', '', async function (res) {
            res.length.should.be.equal(2);
        });
    });
});