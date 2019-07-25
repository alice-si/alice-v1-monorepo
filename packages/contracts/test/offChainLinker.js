var Project = artifacts.require("Project");
var ImpactRegistry = artifacts.require("ImpactRegistry");
var Linker = artifacts.require("OffChainImpactLinker");

require("./test-setup");

contract('Off-Chain Impact Linker', function(accounts) {
	var donor1 = accounts[1];
	var registry, linker;

  const SINGLE_10 = web3.utils.fromAscii('single10');

	it("should attach and configure linker", async function() {
		registry = await ImpactRegistry.new(Project.address);

		linker = await Linker.new(registry.address);

		await registry.setLinker(linker.address);
		(await linker.registry()).should.be.equal(registry.address);
	});

	it("should link one donor, one unit impact", async function() {
		await registry.registerDonation(donor1, 10);
		await registry.registerOutcome(SINGLE_10, 10);

		(await registry.getBalance(donor1)).should.be.bignumber.equal('10');
		(await registry.getImpactValue(SINGLE_10, donor1)).should.be.bignumber.equal('0');

		await linker.linkDirectly(SINGLE_10, 0, 10);

		(await registry.getBalance(donor1)).should.be.bignumber.equal('0');
		(await registry.getImpactValue(SINGLE_10, donor1)).should.be.bignumber.equal('10');
	});

});
