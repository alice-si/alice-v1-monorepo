const Mango = require('../gateways/mangoProxy');
const ModelUtils = require('../utils/model-utils');
const { ModelJob } = require('./job');
const config = require('../config');

const Donation = ModelUtils.loadModel('donation');
const Project = ModelUtils.loadModel('project');

class PaymentCollectingJob extends ModelJob {
  constructor() {
    super('COLLECTING', Donation, 'CREATED');
  }

  async run(donation) {
    donation =
      await donation.populate('_projectId _userId').execPopulate();
    const project = await Project
      .findById(donation._projectId._id)
      .populate('charity');
    const upfrontPayment = project.upfrontPayment;
    const upfrontPaymentAmount = donation.amount * upfrontPayment / 100;
    const charity = project.charity;

    const walletsErr = checkWallets(donation._userId, project, charity);
    if (walletsErr) {
      throw new Error(walletsErr);
    }

    if (upfrontPayment > 100 || upfrontPayment < 0) {
      throw 'UpfrontPayment is not correct number (0-100): ' + project.upfrontPayment;
    }

    this.logger.info('Making upfront transfer for donation: ' + donation._id);
    await this.makeUpfrontTransfer(
      donation, project, charity, upfrontPaymentAmount);

    this.logger.info('Making remainder transfer for donation: ' + donation._id);
    await this.makeRemainderTransfer(
      donation, project, charity, donation.amount - upfrontPaymentAmount);
  }

  async makeUpfrontTransfer(donation, project, charity, upfrontAmount) {
    await this.makeTransfer(
      donation,
      charity.mangoUserId,
      project.mangoBeneficiaryWalletId,
      upfrontAmount);
  }
  
  async makeRemainderTransfer(donation, project, charity, remainder) {
    await this.makeTransfer(
      donation,
      charity.mangoUserId,
      project.mangoContractWalletId,
      remainder);
  }
  
  async makeTransfer(donation, toUserId, toWalletId, amount) {
    if (amount > 0) {
      let mangoResult = await Mango.transfer(
        donation._userId.mangoUserId,
        donation._userId.mangoWalletId,
        toUserId,
        toWalletId,
        amount);

      if (mangoResult.Status == 'FAILED') {
        throw 'Transfer failed: ' + data.Id;
      }

      this.logger.info('Mango transfer completed: '
          + JSON.stringify(mangoResult));
    } else {
      this.logger.info('transfer is skipped - amount = 0');
    }
  }

}

function checkWallets(user, project, charity) {
  let err = '';
  err += (config.technicalMangoUserId) ? '' : 'Config does not have technicalUserId value|';
  err += (user && user.mangoUserId && user.mangoWalletId) ? '' : 'Donor has problems with mango userId or walletId|';
  err += (charity && charity.mangoUserId) ? '' : 'Charity has problems with mango userId|';
  err += (project && project.mangoBeneficiaryWalletId && project.mangoContractWalletId) ? '' : 'Project has problems with mango userId or walletId|';

  return err;
}

module.exports = PaymentCollectingJob;
