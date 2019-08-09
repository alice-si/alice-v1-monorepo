var DemoToken = artifacts.require("DemoToken");

require("./test-setup");

contract('Demo Token', function([owner, anyone]) {

  var token;

  before('deploy DigitalGBPToken', async function() {
    token = await DemoToken.new();
  });

  describe('Self minting', function() {

    it('Should Mint 100 tokens by anyone', async function() {
      await token.mint(100, { from: anyone });
      (await token.balanceOf(anyone)).should.be.bignumber.equal('100', 'Minted 100');
    });


  });
});
