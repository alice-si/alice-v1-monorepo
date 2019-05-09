const JobUtils = require('../utils/job-utils');
const ModelUtils = require('../utils/model-utils');
const Donation = ModelUtils.loadModel('donation');
const Project = ModelUtils.loadModel('project');
const Mango = require('../gateways/mangoProxy');
const Config = require('../config');

function mainAction(jobContext) {
  const donation = jobContext.model;
  let project, charity, upfrontPaymentAmount, upfrontPayment;

  return Project.findById(donation._projectId._id).populate('charity').then(function (projectWithCharity) {
    project = projectWithCharity;
    upfrontPayment = project.upfrontPayment;
    upfrontPaymentAmount = donation.amount * upfrontPayment / 100;
    charity = project.charity;

    const walletsErr = checkWallets(donation._userId, project, charity);
    if (walletsErr) {
      throw walletsErr;
    }
    if (upfrontPayment > 100 || upfrontPayment < 0) {
      throw "UpfrontPayment is not correct number (0-100): " + project.upfrontPayment;
    }

    jobContext.msg("Collecting money from donation: " + donation._id);
  }).then(() => makeUpfrontTransfer(donation, project, charity, upfrontPaymentAmount))
    .then((result) => {
      jobContext.msg('Upfront transfer completed: ' + JSON.stringify(result));
      return makeRemainderTransfer(donation, project, charity, donation.amount - upfrontPaymentAmount);
    })
    .then((result) => {
      jobContext.msg('Remainder transfer completed: ' + JSON.stringify(result));
      jobContext.completedBehaviour();
    })
    .catch(function (err) {
    jobContext.errorBehaviour(err);
  });
}

function checkWallets(user, project, charity) {
  let err = "";
  err += (Config.technicalMangoUserId) ? "" : "Config does not have technicalUserId value|";
  err += (user && user.mangoUserId && user.mangoWalletId) ? "" : "Donor has problems with mango userId or walletId|";
  err += (charity && charity.mangoUserId) ? "" : "Charity has problems with mango userId|";
  err += (project && project.mangoBeneficiaryWalletId && project.mangoContractWalletId) ? "" : "Project has problems with mango userId or walletId|";

  return err;
}

function makeUpfrontTransfer(donation, project, charity, upfrontAmount) {
  return makeTransfer(donation, charity.mangoUserId, project.mangoBeneficiaryWalletId, upfrontAmount);
}

function makeRemainderTransfer(donation, project, charity, remainder) {
  return makeTransfer(donation, charity.mangoUserId, project.mangoContractWalletId, remainder);
}

function makeTransfer(donation, toUserId, toWalletId, amount) {
  if (amount > 0) {
    return Mango.transfer(
      donation._userId.mangoUserId, donation._userId.mangoWalletId,
      toUserId, toWalletId,
      amount).then(function (data) {
      if (data.Status == 'FAILED') {
        throw "Transfer failed: " + data.Id;
      } else {
        return data;
      }
    });
  } else {
    return Promise.resolve('transfer is skipped - amount = 0');
  }
}

module.exports = JobUtils.createJob({
  processName: 'COLLECTING',
  model: Donation,
  createChecker: false,
  startStatus: 'CREATED',
  action: mainAction
});