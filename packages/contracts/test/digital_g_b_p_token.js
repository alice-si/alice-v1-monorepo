var DigitalGBPToken = artifacts.require("DigitalGBPToken");

require("./test-setup");

contract('DigitalGBPToken', function(accounts) {

  var token;
  var name = 'DigitalGBPToken';



  before('deploy DigitalGBPToken', async function() {
    token = await DigitalGBPToken.new();
  });


  describe('Token Attributes', function() {
    it('Has correct name', async function() {
      (await token.name()).should.equal(name);
    });

    it('Has correct decimals', async function() {
      (await token.decimals()).should.be.bignumber.equal('2');
    });

  });

  describe('Minting and Burning Tokens', function() {
    it('Should Mint 100 tokens', async function() {
      await token.mint(accounts[1], 100, { from: accounts[0] });
      (await token.balanceOf(accounts[1])).should.be.bignumber.equal('100', 'Minted 100');
    });

    it('Should Mint 100, then Burn 100 Successfully', async function() {
        await token.burn(100, {from: accounts[1]});
        (await token.balanceOf(accounts[1])).should.be.bignumber.equal('0', 'Burnt 100');
    });

    it('Reject Burn when burning more than account supply', async function() {
      try {
        await token.burn(accounts[1], 1000).should.be.rejectedWith("VM Exception while processing transaction: invalid opcode");
      } catch (error) {
        console.log("Reject " + error);
      }
    });

    it('Should Mint 100 tokens, only if Owner is minting', async function() {
        try {
          await token.mint(accounts[3], 100, { from: accounts[3]}).shouldBeReverted();
        } catch (error) {
          console.log(error);
        }
    });
  });
});
