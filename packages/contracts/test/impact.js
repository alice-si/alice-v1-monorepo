var ImpactRegistry = artifacts.require("ImpactRegistry");
var Linker = artifacts.require("FlexibleImpactLinker");
var Project = artifacts.require("Project");

require("./test-setup");

contract('Single impactRegistry donation', function(accounts) {
  var donor1 = accounts[1];
  var registry, linker;

  const SINGLE_10 = web3.utils.fromAscii('single10');

  it("should attach master contract", async function() {
      registry = await ImpactRegistry.new(Project.address);
      linker = await Linker.new(registry.address, 10);
      await registry.setLinker(linker.address);

      (await linker.unit()).should.be.bignumber.equal('10');
      (await linker.registry()).should.be.equal(registry.address);
  });

  it("should register donation from donor1", async function () {
    await registry.registerDonation(donor1, 10);

    var balance = await registry.getBalance(donor1);

    balance.should.be.bignumber.equal('10');
  });

  it("should register outcome", async function () {
    await registry.registerOutcome(SINGLE_10, 10);

    //Global for impact
    (await registry.getImpactCount(SINGLE_10)).should.be.bignumber.equal('0');
    (await registry.getImpactTotalValue(SINGLE_10)).should.be.bignumber.equal('10');
    (await registry.getImpactLinked(SINGLE_10)).should.be.bignumber.equal('0');

    //Per donor
    (await registry.getImpactValue(SINGLE_10, donor1)).should.be.bignumber.equal('0');
  });


  it("should link impactRegistry", async function () {
      await registry.linkImpact(SINGLE_10);

      //Global for impact
      (await registry.getImpactCount(SINGLE_10)).should.be.bignumber.equal('1');
      (await registry.getImpactTotalValue(SINGLE_10)).should.be.bignumber.equal('10');
      (await registry.getImpactLinked(SINGLE_10)).should.be.bignumber.equal('10');

      //Per donor
      (await registry.getBalance(donor1)).should.be.bignumber.equal('0');
      (await registry.getImpactDonor(SINGLE_10, 0)).should.be.equal(donor1);
      (await registry.getImpactValue(SINGLE_10, donor1)).should.be.bignumber.equal('10');
  });

});

contract('Donation below unit', function(accounts) {
  var donor1 = accounts[1];
  var registry, linker;

  const SINGLE_7 = web3.utils.fromAscii('single7');

  it("should configure impact registry", async function() {
		  registry = await ImpactRegistry.new(Project.address);
      linker = await Linker.new(registry.address, 10);
      await registry.setLinker(linker.address);

    	(await linker.unit()).should.be.bignumber.equal('10');
      (await linker.registry()).should.be.equal(registry.address);
  });


  it("should register donation from donor1", async function () {
      await registry.registerDonation(donor1, 7);

      var balance = await registry.getBalance(donor1);

      balance.should.be.bignumber.equal('7');
  });


  it("should register outcome", async function () {
      await registry.registerOutcome(SINGLE_7, 7);

      //Global for impact
      (await registry.getImpactCount(SINGLE_7)).should.be.bignumber.equal('0');
      (await registry.getImpactTotalValue(SINGLE_7)).should.be.bignumber.equal('7');
      (await registry.getImpactLinked(SINGLE_7)).should.be.bignumber.equal('0');

      //Per donor
      (await registry.getImpactValue(SINGLE_7, donor1)).should.be.bignumber.equal('0');
  });

  it("should link impactRegistry", async function () {
      await registry.linkImpact(SINGLE_7);

      //Global for impact
      (await registry.getImpactCount(SINGLE_7)).should.be.bignumber.equal('1');
      (await registry.getImpactTotalValue(SINGLE_7)).should.be.bignumber.equal('7');
      (await registry.getImpactLinked(SINGLE_7)).should.be.bignumber.equal('7');

      //Per donor
      (await registry.getBalance(donor1)).should.be.bignumber.equal('0');
      (await registry.getImpactDonor(SINGLE_7, 0)).should.be.equal(donor1);
      (await registry.getImpactValue(SINGLE_7, donor1)).should.be.bignumber.equal('7');
  });


});

contract('Donation above unit', function(accounts) {
  var donor1 = accounts[1];
  var registry, linker;

  const SINGLE_13 = web3.utils.fromAscii('single13');

  it("should configure impact registry", async function() {
		  registry = await ImpactRegistry.new(Project.address);
      linker = await Linker.new(registry.address, 10);
      await registry.setLinker(linker.address);

    	(await linker.unit()).should.be.bignumber.equal('10');
      (await linker.registry()).should.be.equal(registry.address);
  });


  it("should register donation from donor1", async function () {
      await registry.registerDonation(donor1, 13);

      var balance = await registry.getBalance(donor1);

      balance.should.be.bignumber.equal('13');
  });

  it("should register outcome", async function () {
      await registry.registerOutcome(SINGLE_13, 13);

      //Global for impact
      (await registry.getImpactCount(SINGLE_13)).should.be.bignumber.equal('0');
      (await registry.getImpactTotalValue(SINGLE_13)).should.be.bignumber.equal('13');
      (await registry.getImpactLinked(SINGLE_13)).should.be.bignumber.equal('0');

      //Per donor
      (await registry.getImpactValue(SINGLE_13, donor1)).should.be.bignumber.equal('0');
  });


  it("should link impactRegistry in 1/2 step (10/13)", async function () {
      await registry.linkImpact(SINGLE_13);

      //Global for impact
      (await registry.getImpactCount(SINGLE_13)).should.be.bignumber.equal('1');
      (await registry.getImpactTotalValue(SINGLE_13)).should.be.bignumber.equal('13');
      (await registry.getImpactLinked(SINGLE_13)).should.be.bignumber.equal('10');

      //Per donor
      (await registry.getBalance(donor1)).should.be.bignumber.equal('3');
      (await registry.getImpactDonor(SINGLE_13, 0)).should.be.equal(donor1);
      (await registry.getImpactValue(SINGLE_13, donor1)).should.be.bignumber.equal('10');
  });

  it("should link impactRegistry in 2/2 step (13/13)", async function () {
    await registry.linkImpact(SINGLE_13);

    //Global for impact
    (await registry.getImpactCount(SINGLE_13)).should.be.bignumber.equal('1');
    (await registry.getImpactTotalValue(SINGLE_13)).should.be.bignumber.equal('13');
    (await registry.getImpactLinked(SINGLE_13)).should.be.bignumber.equal('13');

    //Per donor
    (await registry.getBalance(donor1)).should.be.bignumber.equal('0');
    (await registry.getImpactDonor(SINGLE_13, 0)).should.be.equal(donor1);
    (await registry.getImpactValue(SINGLE_13, donor1)).should.be.bignumber.equal('13');
  });
});

contract('Two donations (15+20)', function(accounts) {
  var donor1 = accounts[1];
  var donor2 = accounts[2];
  var registry, linker;

  const DOUBLE_35 = web3.utils.fromAscii('double35');

  it("should configure impact registry", async function() {
		registry = await ImpactRegistry.new(Project.address);
    linker = await Linker.new(registry.address, 10);
    await registry.setLinker(linker.address);

    (await linker.unit()).should.be.bignumber.equal('10');
    (await linker.registry()).should.be.equal(registry.address);
  });

  it("should register donation(15) from donor1", async function () {
      await registry.registerDonation(donor1, 15);

      var balance = await registry.getBalance(donor1);

      balance.should.be.bignumber.equal('15');
  });

  it("should register donation(20) from donor2", async function () {
      await registry.registerDonation(donor2, 20);

      var balance = await registry.getBalance(donor2);

      balance.should.be.bignumber.equal('20');
  });

  it("should register outcome", async function () {
    await registry.registerOutcome(DOUBLE_35, 35);

    //Global for impact
    (await registry.getImpactCount(DOUBLE_35)).should.be.bignumber.equal('0');
    (await registry.getImpactTotalValue(DOUBLE_35)).should.be.bignumber.equal('35');
    (await registry.getImpactLinked(DOUBLE_35)).should.be.bignumber.equal('0');

    //Per donor
    (await registry.getImpactValue(DOUBLE_35, donor1)).should.be.bignumber.equal('0');
    (await registry.getImpactValue(DOUBLE_35, donor2)).should.be.bignumber.equal('0');
  });

  it("should link impactRegistry in 1/4 step (10/35)", async function () {
    await registry.linkImpact(DOUBLE_35);

    //Global for impact
    (await registry.getImpactCount(DOUBLE_35)).should.be.bignumber.equal('1');
    (await registry.getImpactTotalValue(DOUBLE_35)).should.be.bignumber.equal('35');
    (await registry.getImpactLinked(DOUBLE_35)).should.be.bignumber.equal('10');

    //Per donor1
    (await registry.getBalance(donor1)).should.be.bignumber.equal('5');
    (await registry.getImpactDonor(DOUBLE_35, 0)).should.be.equal(donor1);
    (await registry.getImpactValue(DOUBLE_35, donor1)).should.be.bignumber.equal('10');

		//Per donor2
		(await registry.getBalance(donor2)).should.be.bignumber.equal('20');
		(await registry.getImpactValue(DOUBLE_35, donor2)).should.be.bignumber.equal('0');
  });

	it("should link impactRegistry in 2/4 step (20/35)", async function () {
		await registry.linkImpact(DOUBLE_35);

		//Global for impact
		(await registry.getImpactCount(DOUBLE_35)).should.be.bignumber.equal('2');
		(await registry.getImpactTotalValue(DOUBLE_35)).should.be.bignumber.equal('35');
		(await registry.getImpactLinked(DOUBLE_35)).should.be.bignumber.equal('20');

		//Per donor1
		(await registry.getBalance(donor1)).should.be.bignumber.equal('5');
		(await registry.getImpactDonor(DOUBLE_35, 0)).should.be.equal(donor1);
		(await registry.getImpactValue(DOUBLE_35, donor1)).should.be.bignumber.equal('10');

		//Per donor2
		(await registry.getBalance(donor2)).should.be.bignumber.equal('10');
		(await registry.getImpactDonor(DOUBLE_35, 1)).should.be.equal(donor2);
		(await registry.getImpactValue(DOUBLE_35, donor2)).should.be.bignumber.equal('10');
	});

	it("should link impactRegistry in 3/4 step (25/35)", async function () {
		await registry.linkImpact(DOUBLE_35);

		//Global for impact
		(await registry.getImpactCount(DOUBLE_35)).should.be.bignumber.equal('2');
		(await registry.getImpactTotalValue(DOUBLE_35)).should.be.bignumber.equal('35');
		(await registry.getImpactLinked(DOUBLE_35)).should.be.bignumber.equal('25');

		//Per donor1
		(await registry.getBalance(donor1)).should.be.bignumber.equal('0');
		(await registry.getImpactDonor(DOUBLE_35, 0)).should.be.equal(donor1);
		(await registry.getImpactValue(DOUBLE_35, donor1)).should.be.bignumber.equal('15');

		//Per donor2
		(await registry.getBalance(donor2)).should.be.bignumber.equal('10');
		(await registry.getImpactDonor(DOUBLE_35, 1)).should.be.equal(donor2);
		(await registry.getImpactValue(DOUBLE_35, donor2)).should.be.bignumber.equal('10');
	});

	it("should link impactRegistry in 4/4 step (35/35)", async function () {
		await registry.linkImpact(DOUBLE_35);

		//Global for impact
		(await registry.getImpactCount(DOUBLE_35)).should.be.bignumber.equal('2');
		(await registry.getImpactTotalValue(DOUBLE_35)).should.be.bignumber.equal('35');
		(await registry.getImpactLinked(DOUBLE_35)).should.be.bignumber.equal('35');

		//Per donor1
		(await registry.getBalance(donor1)).should.be.bignumber.equal('0');
		(await registry.getImpactDonor(DOUBLE_35, 0)).should.be.equal(donor1);
		(await registry.getImpactValue(DOUBLE_35, donor1)).should.be.bignumber.equal('15');

		//Per donor2
		(await registry.getBalance(donor2)).should.be.bignumber.equal('0');
		(await registry.getImpactDonor(DOUBLE_35, 1)).should.be.equal(donor2);
		(await registry.getImpactValue(DOUBLE_35, donor2)).should.be.bignumber.equal('20');
	});
});

contract('Two donations (25+25)', function(accounts) {
	var donor1 = accounts[1];
	var donor2 = accounts[2];
	var registry, linker;

  const DOUBLE_50 = web3.utils.fromAscii('double50');

	it("should configure impact registry", async function() {
		registry = await ImpactRegistry.new(Project.address);
		linker = await Linker.new(registry.address, 10);
		await registry.setLinker(linker.address);

    (await linker.unit()).should.be.bignumber.equal('10');
		(await linker.registry()).should.be.equal(registry.address);
	});

	it("should register donation(25) from donor1", async function () {
		await registry.registerDonation(donor1, 25);

		var balance = await registry.getBalance(donor1);

		balance.should.be.bignumber.equal('25');
	});

	it("should register donation(25) from donor2", async function () {
		await registry.registerDonation(donor2, 25);

		var balance = await registry.getBalance(donor2);

		balance.should.be.bignumber.equal('25');
	});

	it("should register outcome", async function () {
		await registry.registerOutcome(DOUBLE_50, 50);

		//Global for impact
		(await registry.getImpactCount(DOUBLE_50)).should.be.bignumber.equal('0');
		(await registry.getImpactTotalValue(DOUBLE_50)).should.be.bignumber.equal('50');
		(await registry.getImpactLinked(DOUBLE_50)).should.be.bignumber.equal('0');

		//Per donor
		(await registry.getImpactValue(DOUBLE_50, donor1)).should.be.bignumber.equal('0');
		(await registry.getImpactValue(DOUBLE_50, donor2)).should.be.bignumber.equal('0');
	});

	it("should link impactRegistry in 1/6 step (10/50)", async function () {
		await registry.linkImpact(DOUBLE_50);

		//Global for impact
		(await registry.getImpactCount(DOUBLE_50)).should.be.bignumber.equal('1');
		(await registry.getImpactTotalValue(DOUBLE_50)).should.be.bignumber.equal('50');
		(await registry.getImpactLinked(DOUBLE_50)).should.be.bignumber.equal('10');

		//Per donor1
		(await registry.getBalance(donor1)).should.be.bignumber.equal('15');
		(await registry.getImpactDonor(DOUBLE_50, 0)).should.be.equal(donor1);
		(await registry.getImpactValue(DOUBLE_50, donor1)).should.be.bignumber.equal('10');

		//Per donor2
		(await registry.getBalance(donor2)).should.be.bignumber.equal('25');
		(await registry.getImpactValue(DOUBLE_50, donor2)).should.be.bignumber.equal('0');
	});

	it("should link impactRegistry in 2/6 step (20/50)", async function () {
		await registry.linkImpact(DOUBLE_50);

		//Global for impact
		(await registry.getImpactCount(DOUBLE_50)).should.be.bignumber.equal('2');
		(await registry.getImpactTotalValue(DOUBLE_50)).should.be.bignumber.equal('50');
		(await registry.getImpactLinked(DOUBLE_50)).should.be.bignumber.equal('20');

		//Per donor1
		(await registry.getBalance(donor1)).should.be.bignumber.equal('15');
		(await registry.getImpactDonor(DOUBLE_50, 0)).should.be.equal(donor1);
		(await registry.getImpactValue(DOUBLE_50, donor1)).should.be.bignumber.equal('10');

		//Per donor2
		(await registry.getBalance(donor2)).should.be.bignumber.equal('15');
		(await registry.getImpactDonor(DOUBLE_50, 1)).should.be.equal(donor2);
		(await registry.getImpactValue(DOUBLE_50, donor2)).should.be.bignumber.equal('10');
	});

	it("should link impactRegistry in 3/6 step (30/50)", async function () {
		await registry.linkImpact(DOUBLE_50);

		//Global for impact
		(await registry.getImpactCount(DOUBLE_50)).should.be.bignumber.equal('2');
		(await registry.getImpactTotalValue(DOUBLE_50)).should.be.bignumber.equal('50');
		(await registry.getImpactLinked(DOUBLE_50)).should.be.bignumber.equal('30');

		//Per donor1
		(await registry.getBalance(donor1)).should.be.bignumber.equal('5');
		(await registry.getImpactDonor(DOUBLE_50, 0)).should.be.equal(donor1);
		(await registry.getImpactValue(DOUBLE_50, donor1)).should.be.bignumber.equal('20');

		//Per donor2
		(await registry.getBalance(donor2)).should.be.bignumber.equal('15');
		(await registry.getImpactDonor(DOUBLE_50, 1)).should.be.equal(donor2);
		(await registry.getImpactValue(DOUBLE_50, donor2)).should.be.bignumber.equal('10');
	});

	it("should link impactRegistry in 4/6 step (40/50)", async function () {
		await registry.linkImpact(DOUBLE_50);

		//Global for impact
		(await registry.getImpactCount(DOUBLE_50)).should.be.bignumber.equal('2');
		(await registry.getImpactTotalValue(DOUBLE_50)).should.be.bignumber.equal('50');
		(await registry.getImpactLinked(DOUBLE_50)).should.be.bignumber.equal('40');

		//Per donor1
		(await registry.getBalance(donor1)).should.be.bignumber.equal('5');
		(await registry.getImpactDonor(DOUBLE_50, 0)).should.be.equal(donor1);
		(await registry.getImpactValue(DOUBLE_50, donor1)).should.be.bignumber.equal('20');

		//Per donor2
		(await registry.getBalance(donor2)).should.be.bignumber.equal('5');
		(await registry.getImpactDonor(DOUBLE_50, 1)).should.be.equal(donor2);
		(await registry.getImpactValue(DOUBLE_50, donor2)).should.be.bignumber.equal('20');
	});

	it("should link impactRegistry in 5/6 step (45/50)", async function () {
		await registry.linkImpact(DOUBLE_50);

		//Global for impact
		(await registry.getImpactCount(DOUBLE_50)).should.be.bignumber.equal('2');
		(await registry.getImpactTotalValue(DOUBLE_50)).should.be.bignumber.equal('50');
		(await registry.getImpactLinked(DOUBLE_50)).should.be.bignumber.equal('45');

		//Per donor1
		(await registry.getBalance(donor1)).should.be.bignumber.equal('0');
		(await registry.getImpactDonor(DOUBLE_50, 0)).should.be.equal(donor1);
		(await registry.getImpactValue(DOUBLE_50, donor1)).should.be.bignumber.equal('25');

		//Per donor2
		(await registry.getBalance(donor2)).should.be.bignumber.equal('5');
		(await registry.getImpactDonor(DOUBLE_50, 1)).should.be.equal(donor2);
		(await registry.getImpactValue(DOUBLE_50, donor2)).should.be.bignumber.equal('20');
	});

	it("should link impactRegistry in 6/6 step (50/50)", async function () {
		await registry.linkImpact(DOUBLE_50);

		//Global for impact
		(await registry.getImpactCount(DOUBLE_50)).should.be.bignumber.equal('2');
		(await registry.getImpactTotalValue(DOUBLE_50)).should.be.bignumber.equal('50');
		(await registry.getImpactLinked(DOUBLE_50)).should.be.bignumber.equal('50');

		//Per donor1
		(await registry.getBalance(donor1)).should.be.bignumber.equal('0');
		(await registry.getImpactDonor(DOUBLE_50, 0)).should.be.equal(donor1);
		(await registry.getImpactValue(DOUBLE_50, donor1)).should.be.bignumber.equal('25');

		//Per donor2
		(await registry.getBalance(donor2)).should.be.bignumber.equal('0');
		(await registry.getImpactDonor(DOUBLE_50, 1)).should.be.equal(donor2);
		(await registry.getImpactValue(DOUBLE_50, donor2)).should.be.bignumber.equal('25');
	});


});
