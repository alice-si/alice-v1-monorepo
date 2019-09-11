var CompliantCoupon = artifacts.require("CompliantCoupon");
var BlockingTransferChecker = artifacts.require("BlockingTransferChecker");

require("../test-setup");

contract('Compliant Coupon', function ([operator, sender, recipient]) {

  var compliantCoupon, blockingChecker;

  step("should define compliant coupon", async function () {
    compliantCoupon = await CompliantCoupon.new(100);
    await compliantCoupon.mint(sender, 100);

    (await compliantCoupon.balanceOf(sender)).should.be.bignumber.equal('100');
    (await compliantCoupon.balanceOf(recipient)).should.be.bignumber.equal('0');
  });

  step("should transfer without checkers", async function () {
    await compliantCoupon.transfer(recipient, 10, {from: sender});

    (await compliantCoupon.balanceOf(sender)).should.be.bignumber.equal('90');
    (await compliantCoupon.balanceOf(recipient)).should.be.bignumber.equal('10');
  });

  step("should prevent transfer after adding a blocking checker", async function () {
    blockingChecker = await BlockingTransferChecker.new();
    await compliantCoupon.addChecker(blockingChecker.address, {from:operator});

    await compliantCoupon.transfer(recipient, 10, {from: sender}).shouldBeReverted();

    (await compliantCoupon.balanceOf(sender)).should.be.bignumber.equal('90');
    (await compliantCoupon.balanceOf(recipient)).should.be.bignumber.equal('10');
  });

  step("should allow transfer after removing a blocking checker", async function () {
    await compliantCoupon.removeChecker(blockingChecker.address, {from:operator});

    await compliantCoupon.transfer(recipient, 10, {from: sender});

    (await compliantCoupon.balanceOf(sender)).should.be.bignumber.equal('80');
    (await compliantCoupon.balanceOf(recipient)).should.be.bignumber.equal('20');
  });

});
