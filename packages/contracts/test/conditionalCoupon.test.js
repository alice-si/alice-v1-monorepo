var ConditionalCoupon = artifacts.require("ConditionalCoupon");
var DigitalGBPToken = artifacts.require("DigitalGBPToken");
const {toHex, padLeft, keccak256, asciiToHex, toBN, fromWei} = web3.utils;

require("./test-setup");

contract('Conditional Coupon', function ([owner, oracle, donor]) {


  const QUESTION_ID = web3.utils.fromAscii('Q1');

  const CONDITION_ID = web3.utils.soliditySha3({
    t: 'address',
    v: oracle
  }, {
    t: 'bytes32',
    v: QUESTION_ID
  }, {
    t: 'uint',
    v: 2
  });

  contract('Should split and merge', async function () {

    var conditionalCoupon;
    var collateral;

    step("should create conditional coupon", async function () {
      conditionalCoupon = await ConditionalCoupon.new();
    });

    step("should create collateral token", async function () {
      collateral = await DigitalGBPToken.new();
      await collateral.mint(donor, 100);
      (await collateral.balanceOf(donor)).should.be.bignumber.equal('100');
    });

    step("should prepare condition", async function () {
      await conditionalCoupon.prepareCondition(oracle, QUESTION_ID, 2);
      let slotsCount = await conditionalCoupon.getOutcomeSlotCount(CONDITION_ID);
      (await slotsCount).should.be.bignumber.equal('2');
    });

    step("should split position", async function () {
      await collateral.approve(conditionalCoupon.address, 100, {from: donor});
      await conditionalCoupon.splitPosition(collateral.address, asciiToHex(0), CONDITION_ID, [0b01, 0b10], 100, {from: donor});

      (await collateral.balanceOf(donor)).should.be.bignumber.equal('0');
      (await collateral.balanceOf(conditionalCoupon.address)).should.be.bignumber.equal('100');
    });

    step("should merge position", async function () {
      await conditionalCoupon.mergePositions(collateral.address, asciiToHex(0), CONDITION_ID, [0b01, 0b10], 100, {from: donor});

      (await collateral.balanceOf(donor)).should.be.bignumber.equal('100');
      (await collateral.balanceOf(conditionalCoupon.address)).should.be.bignumber.equal('0');
    });
  })


});
