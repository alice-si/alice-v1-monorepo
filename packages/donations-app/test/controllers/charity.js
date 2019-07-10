const TestUtils = require('../test-utils');
const Utils = TestUtils.loadModuleFromDevServer('service/utils');
const Charity = Utils.loadModel('charity');
const User = Utils.loadModel('user');

// TODO we can add tests for adding charityAdmin to charity later
describe('CharityController', function () {
    let charity1, charity2, charity1Saved, charity2Saved;

    TestUtils.setBeforeAndAfterHooksForControllerTest({
        name: 'charity'
    });

    it('Should create charities', async function () {
        charity1 = new Charity({
            name: 'Test1',
            legalName: 'Test1_Legal',
            code: 'Test1'
        });
        charity2 = new Charity({
            name: 'Test2',
            legalName: 'Test2_Legal',
            code: 'Test2'
        });
        charity1Saved = await charity1.save();
        charity2Saved = await charity2.save();
    });

    it('Should get charities', function () {
        return TestUtils.testGet('getCharities', '', function (res) {
            res.length.should.be.equal(2);
            res[0].name.should.be.equal('Test1');
            res[0].code.should.be.equal('Test1');
            res[0]._id.should.be.equal(charity1Saved._id.toString());
        });
    });

    it('Should get charity', function () {
        return TestUtils.testGet('getCharity', charity1.code, function (res) {
            res._id.should.be.equal(charity1Saved._id.toString());
            res.code.should.be.equal(charity1.code);
            res.name.should.be.equal(charity1.name);
            res.legalName.should.be.equal(charity1.legalName);
        })
    });

    it('Should save charity', async function () {
        let someUser = await User.findOne();
        let charityToSave = {
            name: 'Test3',
            legalName: 'Test3_Legal',
            code: 'Test3',
            charityAdmins: [someUser._id]
        };
        return TestUtils.testPost('saveCharity', charityToSave, async function (res) {
            let charityCreated = await Charity.findOne({code: 'Test3'});
            charityCreated.toObject().should.be.shallowDeepEqual(res);
        })
    });
});
