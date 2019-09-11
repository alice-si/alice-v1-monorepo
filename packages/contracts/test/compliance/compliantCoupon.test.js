var CompliantCoupon = artifacts.require("CompliantCoupon");
var BlockingTransferChecker = artifacts.require("BlockingTransferChecker");
var SingleLimitTransferChecker = artifacts.require("SingleLimitTransferChecker");
var AccountLimitTransferChecker = artifacts.require("AccountLimitTransferChecker");

require("../test-setup");

contract('Compliant Coupon', function ([operator, sender, recipient]) {

  var compliantCoupon, blockingChecker, singleLimitChecker, accountLimitTransferChecker;

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


  step("should block transfer above a defined limit with SingleLimitTransferChecker", async function () {
    singleLimitChecker = await SingleLimitTransferChecker.new(10);
    await compliantCoupon.addChecker(singleLimitChecker.address, {from:operator});

    await compliantCoupon.transfer(recipient, 20, {from: sender}).shouldBeReverted();

    (await compliantCoupon.balanceOf(sender)).should.be.bignumber.equal('80');
    (await compliantCoupon.balanceOf(recipient)).should.be.bignumber.equal('20');
  });


  step("should allow transfers within a defined limit with SingleLimitTransferChecker", async function () {

    await compliantCoupon.transfer(recipient, 10, {from: sender});

    (await compliantCoupon.balanceOf(sender)).should.be.bignumber.equal('70');
    (await compliantCoupon.balanceOf(recipient)).should.be.bignumber.equal('30');
  });


  step("should allow first transfer while AccountLimitChecker is attached", async function () {
    accountLimitTransferChecker = await AccountLimitTransferChecker.new(10);
    await compliantCoupon.addChecker(accountLimitTransferChecker.address, {from:operator});
    (await accountLimitTransferChecker.getTransferred(compliantCoupon.address, sender)).should.be.bignumber.equal('0');

    await compliantCoupon.transfer(recipient, 10, {from: sender});

    (await accountLimitTransferChecker.getTransferred(compliantCoupon.address, sender)).should.be.bignumber.equal('10');
    (await compliantCoupon.balanceOf(sender)).should.be.bignumber.equal('60');
    (await compliantCoupon.balanceOf(recipient)).should.be.bignumber.equal('40');
  });


  step("should block subsequent transfers after a limit per account is exceed", async function () {

    await compliantCoupon.transfer(recipient, 10, {from: sender}).shouldBeReverted();

    (await compliantCoupon.balanceOf(sender)).should.be.bignumber.equal('60');
    (await compliantCoupon.balanceOf(recipient)).should.be.bignumber.equal('40');
  });

});
