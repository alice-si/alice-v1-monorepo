var ClaimsRegistry = artifacts.require("ClaimsRegistry");

require("./test-setup");

contract('Claims registry', function([main, issuer, validator, subject]) {
  var claimsRegistry;
  const KEY_1 = '0x0000000000000000000000000000000000000000000000000000000000000001';
  const CLAIM = '0x000000000000000000000000000000000000000000000000000000000000000c';
  const CLAIM_UPDATED = '0x000000000000000000000000000000000000000000000000000000000000000d';

  before("deploy Claim Registry", async function() {
    claimsRegistry = await ClaimsRegistry.new();
  });


  it("should not return claims from an empty registry", async function() {
    (await claimsRegistry.getClaim(issuer, subject, KEY_1)).should.be.zeroAddress();
  });


  it("should add a claim", async function() {
    await claimsRegistry.setClaim(subject, KEY_1, CLAIM, {from: issuer});
    (await claimsRegistry.getClaim(issuer, subject, KEY_1)).should.be.equal(CLAIM);
  });


  it("should not report approval before making one", async function() {
    (await claimsRegistry.isApproved(validator, issuer, subject, KEY_1)).should.be.false;
  });


  it("should approve a claim", async function() {
    await claimsRegistry.approveClaim(issuer, subject, KEY_1, {from: validator});
    (await claimsRegistry.isApproved(validator, issuer, subject, KEY_1)).should.be.true;
  });


  it("a changed claim should not longer be approved", async function() {
    await claimsRegistry.setClaim(subject, KEY_1, CLAIM_UPDATED, {from: issuer});
    (await claimsRegistry.isApproved(validator, issuer, subject, KEY_1)).should.be.false;
  });


});
