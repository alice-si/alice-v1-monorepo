var Project = artifacts.require("Project");
var ImpactRegistry = artifacts.require("ImpactRegistry");
var Linker = artifacts.require("FlexibleImpactLinker");

require("./test-setup");

contract('Flexible Impact Linker', function(accounts) {
    var donor1 = accounts[1];
    var donor2 = accounts[2];
    var registry, linker;

    const SINGLE_10 = web3.utils.fromAscii('single-10');
    const DOUBLE_20 = web3.utils.fromAscii('double-20');

    it("should attach and configure linker", async function() {
      registry = await ImpactRegistry.new(Project.address);

      linker = await Linker.new(registry.address, 10);
      await registry.setLinker(linker.address);

      (await linker.unit()).should.be.bignumber.equal('10');
      (await linker.registry()).should.be.equal(registry.address);
    });

    it("should link one donor, one unit impact", async function() {
        await registry.registerDonation(donor1, 10);
        await registry.registerOutcome(SINGLE_10, 10);

        (await registry.getBalance(donor1)).should.be.bignumber.equal('10');
        (await registry.getImpactValue(SINGLE_10, donor1)).should.be.bignumber.equal('0');

        await registry.linkImpact(SINGLE_10);

        (await registry.getBalance(donor1)).should.be.bignumber.equal('0');
        (await registry.getImpactValue(SINGLE_10, donor1)).should.be.bignumber.equal('10');
    });

    it("should link two donors, two units impact", async function() {
        await registry.registerDonation(donor1, 10);
        await registry.registerDonation(donor2, 10);
        await registry.registerOutcome(DOUBLE_20, 20);

        (await registry.getImpactValue(DOUBLE_20, donor1)).should.be.bignumber.equal('0');
        (await registry.getImpactValue(DOUBLE_20, donor2)).should.be.bignumber.equal('0');

        await registry.linkImpact(DOUBLE_20);
        await registry.linkImpact(DOUBLE_20);

        (await registry.getBalance(donor1)).should.be.bignumber.equal('0');
        (await registry.getImpactValue(DOUBLE_20, donor1)).should.be.bignumber.equal('10');
        (await registry.getImpactValue(DOUBLE_20, donor2)).should.be.bignumber.equal('10');
    });

});
