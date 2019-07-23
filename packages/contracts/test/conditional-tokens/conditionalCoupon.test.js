var ConditionalCoupon = artifacts.require("ConditionalCoupon");
var DigitalGBPToken = artifacts.require("DigitalGBPToken");
const {toHex, padLeft, keccak256, asciiToHex, toBN, fromWei} = web3.utils;

require("../test-setup");

contract('Conditional Coupon', function ([owner, oracle, donor, hacker]) {


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

  async function getPositionId(CONDITION_ID, collateral,  index) {
    let collectionId = await conditionalCoupon.getCollectionId(asciiToHex(0), CONDITION_ID, index);
    return web3.utils.soliditySha3({
      t: 'address',
      v: collateral.address
    }, {
      t: 'bytes32',
      v: collectionId
    });
  };

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
  });

  contract('Should get results and redeem', async function () {

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

    step("should report results", async function() {
      let resultsSet = web3.utils.toHex("0x" + [padLeft("1", 64), padLeft("0", 64)].join(""));
      await conditionalCoupon.receiveResult(QUESTION_ID, resultsSet, {from: oracle});

      (await conditionalCoupon.payoutDenominator(CONDITION_ID)).should.be.bignumber.equal('1');
      (await conditionalCoupon.payoutNumerators(CONDITION_ID, 0)).should.be.bignumber.equal('1');
      (await conditionalCoupon.payoutNumerators(CONDITION_ID, 1)).should.be.bignumber.equal('0');
    });

    step("should redeem position", async function() {
      await conditionalCoupon.redeemPositions(collateral.address, asciiToHex(0), CONDITION_ID, [0b01, 0b10], {from: donor});

      (await collateral.balanceOf(donor)).should.be.bignumber.equal('100');
      (await collateral.balanceOf(conditionalCoupon.address)).should.be.bignumber.equal('0');
    });

  });

});
