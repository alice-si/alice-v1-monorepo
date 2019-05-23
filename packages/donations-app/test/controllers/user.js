const TestUtils = require('../test-utils');
const Utils = TestUtils.loadModuleFromDevServer('service/utils');
const User = Utils.loadModel('user');

describe('UserController', function () {
    let usersSaved = [], user1, user2, user3;

    TestUtils.setBeforeAndAfterHooksForControllerTest('user');

    it('Should get user data', async function () {
        user1 = new User(TestUtils.getTestUserData('test_user_jan@gmail.com'));
        user2 = new User(TestUtils.getTestUserData('test_user_maciej@gmail.com'));
        user3 = new User(TestUtils.getTestUserData('test_user_jan_qwe@gmail.com'));
        usersSaved = [];

        usersSaved.push(await user1.save());
        usersSaved.push(await user2.save());
        usersSaved.push(await user3.save());

        await TestUtils.testPost('getUsersData', [usersSaved[0]._id, usersSaved[1]._id, 1, 2], function (res) {
            res.length.should.be.equal(2);
        }, true);
    });

    it('Should find 2 users', async function () {
        await TestUtils.testGet('userSearch', 'jan', function (res) {
            res.length.should.be.equal(2);
        });
    });

    it('Should find 1 user', async function () {
        await TestUtils.testGet('userSearch', 'maciej', function (res) {
            res.length.should.be.equal(1);
            res[0]._id.should.be.equal(usersSaved[1]._id.toString());
        });
    });

    it('Should get user details', async function () {
        await TestUtils.testGet('user', usersSaved[0]._id.toString(), function (res) {
            res.email.should.be.equal(usersSaved[0].email);
        });
    });
});