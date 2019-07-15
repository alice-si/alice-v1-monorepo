const TestUtils = require('../test-utils');
const Utils = TestUtils.loadModuleFromDevServer('service/utils');
const User = Utils.loadModel('user');
const Charity = Utils.loadModel('charity');

describe('AuthenticationController', function () {
    let objects, accessCode;
    const testEmail = 'tomTesterTesterowski@gmail.com';
    const testPassword = 'ttt';

    const testUserData = TestUtils.getTestUserData(testEmail);
    
    TestUtils.setBeforeAndAfterHooksForControllerTest({
        name: 'authentication'
    });

    it('Should create test objects', async function () {
        objects = await TestUtils.createTestObjects();
    });

    it('Should sign up', function () {
        testUserData.password = testPassword;
        return TestUtils.testPost('signup', testUserData, res => {
            res.userId.should.not.be.null;
        });
    });

    it('User should be signed up', function () {
        return User.findOne({email: testEmail}).then(function (user) {
            user.validator.length.should.be.equal(0);
            user.superadmin.should.be.false;
            user.mangoUserId.should.not.be.null;
            user.mangoWalletId.should.not.be.null;
        });
    });

    it('Should authenticate', function () {
        return TestUtils.testPost('authenticate', {
            email: testEmail,
            password: testPassword
        }, res => {
            res.token.should.not.be.empty;
        });
    });

    it('Should not authenticate - user does not exist', async function () {
        await TestUtils.testPost('authenticate', {
            email: testEmail + 'NOT_EXISTING',
            password: ''
        }).should.be.rejectedWith(400);
    });

    it('Should not authenticate - password is incorrect', async function () {
        await TestUtils.testPost('authenticate', {
            email: testEmail,
            password: testPassword + 'INCORRECT'
        }).should.be.rejectedWith(400);
    });

    it('Should send reset password link', function () {
        return TestUtils.testPost('resetPassword', {
            email: testEmail
        }, res => {
            res.should.be.equal('Password reset sent to: ' + testEmail);
        });
    });

    it('Should change password', async function () {
        const userObj = await User.findOne({email: testEmail});
        const changePwdToken = userObj.passwordChangeToken;

        await TestUtils.testPost('changePassword', {
            passwordChangeToken: changePwdToken,
            password: 'NEW_PASSWORD'
        }, res => {
            res.should.be.equal('Password change request registered. We will notify you by email when the process is complete.');
        });
    });

    it('Should get token for anonymous donation for existent user', function () {
        return TestUtils.testPost('getTokenForAnonymousDonation', {
            email: testEmail
        }, res => {
            res.token.should.not.be.empty;
        });
    });

    it('Should not get token for anonymous donation for non-existent user', async function () {
        return TestUtils.testPost('getTokenForAnonymousDonation', {
            email: 'nonRegisteredEmail@gmail.com'
        }, res => {
            res.token.should.not.be.empty;
        });
    });

    it('Should not request access code (oauth2) - charity url is not allowed', async function () {
        await TestUtils.testPost('oauth2/requestAccessCode', {
            redirectUrl: 'badurl',
            charityId: objects.charity._id.toString(),
            scope: 'donations_only',
        }).should.be.rejectedWith(400);
    });

    it('Should request access code (oauth2)', async function () {
        const url = 'https://charity-url123.com';
        await Charity.findByIdAndUpdate(objects.charity._id, {
            allowedRedirectUrls: [url]
        });
        
        await TestUtils.testPost('oauth2/requestAccessCode', {
            redirectUrl: url,
            charityId: objects.charity._id.toString(),
            scope: 'donations_only',
        }, res => {
            res.accessCode.should.not.be.empty;
            accessCode = res.accessCode;
        });
    });

    it('Should get access token', async function () {
        await TestUtils.testPost(
            'oauth2/getAccessToken',
            { accessCode },
            res => {
                res.token.should.not.be.empty;
            });
    });
});