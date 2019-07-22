const expect = require('chai').expect;

const TestUtils = require('../test-utils');

const Utils = TestUtils.loadModuleFromDevServer('service/utils');
const Validation = Utils.loadModel('validation');

describe('ValidationController', function () {
  TestUtils.setBeforeAndAfterHooksForControllerTest({
    name: 'validation'
  });

  describe('getValidatorSummary', () => {
    let projectFoo, projectBar, donor, validatorFoo, validatorBar;

    before(async () => {
      let charity = await TestUtils.createCharity();
      projectFoo = await TestUtils.createProject(charity, {code: 'foo'});
      projectBar = await TestUtils.createProject(charity, {code: 'bar'});

      donor = await TestUtils.createUser();

      validatorFoo = await TestUtils.createUser();
      validatorFoo.validator = [projectFoo._id];
      await validatorFoo.save();

      validatorBar = await TestUtils.createUser();
      validatorBar.validator = [projectBar._id];
      await validatorBar.save();
    });

    it('should return projects the user is validator for', async () => {
      let res =
        await TestUtils.testGet('getValidatorSummary', '', null, validatorFoo);
      let codes = res.map(project => project.code);
      expect(codes).to.include('foo');
    });

    it('should not return unrelated projects', async () => {
      let res =
        await TestUtils.testGet('getValidatorSummary', '', null, validatorFoo);
      let codes = res.map(project => project.code);
      expect(codes).to.not.include('bar');
    });

    it('should return 403 for non-validators', async () => {
      await TestUtils.testGet('getValidatorSummary', '', null, donor)
        .should.be.rejectedWith('403');
    });
  });

  describe('projects/:code/validations', () => {
    let project, outcome, validator;
    let claimedValidation, approvedValidation, processedValidation;

    before(async () => {
      let charity = await TestUtils.createCharity();
      project = await TestUtils.createProject(charity, {code: 'baz'});
      outcome = await TestUtils.createOutcome(project);
      validator = await TestUtils.createUser();
      validator.validator = [project._id];
      await validator.save();

      claimedValidation = await TestUtils.createValidation(
        outcome, { status: 'CLAIMING_COMPLETED' });
      approvedValidation = await TestUtils.createValidation(
        outcome, { status: 'APPROVED' });
      processedValidation = await TestUtils.createValidation(
        outcome, { status: 'IMPACT_FETCHING_COMPLETED' });
    });

    it('should return claimed validations', async () => {
      let res = await TestUtils.testGet(
        'projects/baz/validations', '', null, validator);
      expect(res.claimed.length).to.equal(1);
    });

    it('should return approved validations as processing', async () => {
      let res = await TestUtils.testGet(
        'projects/baz/validations', '', null, validator);
      expect(res.processingValidation.length).to.equal(1);
    });

    it('should return fully processed validations', async () => {
      let res = await TestUtils.testGet(
        'projects/baz/validations', '', null, validator);
      expect(res.validated.length).to.equal(1);
    });
  });

  describe('claimOutcome', async () => {
    let charity, project, outcome, admin, donor, amount = 100;

    beforeEach(async () => {
      charity = await TestUtils.createCharity();
      project = await TestUtils.createProject(charity, {fundingTarget: 1000});
      outcome = await TestUtils.createOutcome(project, {amount});

      admin = await TestUtils.createUser({
        password: 'foo',
        charityAdmin: charity._id,
      });
      donor = await TestUtils.createUser({password: 'bar'});
      await TestUtils.createDonation(donor, project, {amount});
    });

    it('should create Validation objects if requested by admin', async () => {
      let data = {
        outcomeId: outcome._id,
        quantity: 1,
        password: 'foo',
      };
      let res = await TestUtils.testPost('claimOutcome', data, null, admin);
      res.should.not.be.empty;
    });

    it('should set _claimerId for created objects', async () => {
      let data = {
        outcomeId: outcome._id,
        quantity: 1,
        password: 'foo',
      };
      let res = await TestUtils.testPost('claimOutcome', data, null, admin);
      expect(res[0]._claimerId).to.have.lengthOf.at.least(1);
    });

    it('should reject claims with amount over project target', async () => {
      let data = {
        outcomeId: outcome._id,
        quantity: 11,
        password: 'foo',
      };
      await TestUtils.testPost('claimOutcome', data, null, admin)
        .should.be.rejectedWith('400');
    });

    it('should reject invalid password', async () => {
      let data = {
        outcomeId: outcome._id,
        quantity: 1,
        password: 'bar',
      };
      await TestUtils.testPost('claimOutcome', data, null, admin)
        .should.be.rejectedWith('401');
    });

    it('should not work without a password', async () => {
      let data = {
        outcomeId: outcome._id,
        quantity: 1,
      };
      await TestUtils.testPost('claimOutcome', data, null, admin)
        .should.be.rejectedWith('401');
    });

    it('should not work if requester is not admin', async () => {
      let data = {
        outcomeId: outcome._id,
        quantity: 1,
        password: 'bar',
      };
      await TestUtils.testPost('claimOutcome', data, null, donor)
        .should.be.rejectedWith('403');
    });
  });

  describe('approveClaim', async () => {
    let charity, project, outcome, admin, validator, validation, amount = 100;

    beforeEach(async() => {
      charity = await TestUtils.createCharity();
      project = await TestUtils.createProject(charity);
      outcome = await TestUtils.createOutcome(project, {amount});

      admin = await TestUtils.createUser({
        password: 'foo',
        charityAdmin: charity._id,
      });

      validator = await TestUtils.createUser({
        password: 'bar',
        validator: [project._id],
      });

      validation = await TestUtils.createValidation(outcome, {
        status: 'CREATED',
        amount: outcome.amount,
        _claimerId: admin._id
      });
    });

    async function receiveDonations(amount) {
      await TestUtils.createDonation(await TestUtils.createUser(), project, {amount});
    }

    async function finishClaiming() {
      let dbValidation = await Validation.findById(validation._id);
      dbValidation.status = 'CLAIMING_COMPLETED';
      await dbValidation.save();
    }

    it('should approve claims when requested by validator', async () => {
      await receiveDonations(100);
      await finishClaiming();

      let data = {
        validationId: validation._id,
        password: 'bar',
      };
      await TestUtils.testPost('approveClaim', data, null, validator);

      let dbValidation = await Validation.findById(validation._id);
      dbValidation.status.should.equal('APPROVED');
    });

    it('should set _validatorId for approved claims', async () => {
      await receiveDonations(100);
      await finishClaiming();

      let data = {
        validationId: validation._id,
        password: 'bar',
      };
      await TestUtils.testPost('approveClaim', data, null, validator);

      let dbValidation = await Validation.findById(validation._id);
      expect(dbValidation._validatorId).to.not.be.undefined;
    });

    it('should not approve claims when user is not validator', async () => {
      await receiveDonations(100);
      await finishClaiming();

      let data = {
        validationId: validation._id,
        password: 'foo',
      };
      await TestUtils.testPost('approveClaim', data, null, admin)
        .should.be.rejectedWith('403');
    });

    it('should not approve claims not processed by blockchain', async () => {
      await receiveDonations(100);
      let data = {
        validationId: validation._id,
        password: 'bar',
      };
      await TestUtils.testPost('approveClaim', data, null, validator)
        .should.be.rejectedWith('Invalid claim status');
    });

    it('should not approve claims when password is invalid', async () => {
      await receiveDonations(100);
      await finishClaiming();

      let data = {
        validationId: validation._id,
        password: 'notBar',
      };
      await TestUtils.testPost('approveClaim', data, null, validator)
        .should.be.rejectedWith('401');
    });

    it('should not approve claims when not enough project funds', async () => {
      await finishClaiming();

      let data = {
        validationId: validation._id,
        password: 'bar'
      };
      await TestUtils.testPost('approveClaim', data, null, validator)
        .should.be.rejectedWith('400');
    });
  });
});
