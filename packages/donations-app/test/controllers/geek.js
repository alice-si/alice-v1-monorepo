const TestUtils = require('../test-utils');
const Utils = TestUtils.loadModuleFromDevServer('service/utils');
const Impact = Utils.loadModel('impact');
const Donation = Utils.loadModel('donation');
const Validation = Utils.loadModel('validation');

describe('GeekController', function () {
    const testAmount = 100;
    let donation, validation;

    TestUtils.setBeforeAndAfterHooksForControllerTest('geek');

    it('Should create test objects', async function () {
        const userId = TestUtils.loggedUserId;

        donation = await new Donation({
            _userId: userId
        }).save();
        validation = await new Validation({
            executionTx: '0x0'
        }).save();
        impact = await new Impact({
            _userId: userId,
            _validationId: validation._id,
            amount: testAmount
        }).save();
    });

    it('Should get my transactions', function () {
        return TestUtils.testGet('getMyTransactions', '', async function (res) {
            res.should.be.an('object').that.have.all.keys(['donations', 'impacts']);
            res.donations.length.should.be.equal(1);
            res.impacts.length.should.be.equal(1);
            donation.toObject().should.be.shallowDeepEqual(res.donations[0]);
            res.impacts[0].amount.should.be.equal(testAmount);
        });
    });
});