var ProjectCatalog = artifacts.require("ProjectCatalog");
var DemoInvestmentWallet = artifacts.require("DemoInvestmentWallet");
var DemoToken = artifacts.require("DemoToken");

require("./test-setup");

contract('ProjectWithBonds', function([owner]) {

  var catalog;
  var wallet;
  var token;


  it("setup contracts", async function() {
    catalog = await ProjectCatalog.new();
    wallet = await DemoInvestmentWallet.new(catalog.address);
    token = await DemoToken.new();
  });

  it("should get tokens", async function() {
    await wallet.requestTokens(token.address, 100);

    (await token.balanceOf(wallet.address)).should.be.bignumber.equal('100');
  });

});


