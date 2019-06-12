const Auth = require('../service/auth');
const Mango = require('../service/mango');
const Mail = require('../service/mail');
const Utils = require('../service/utils');
const Config = require('../../config');
const Donation = Utils.loadModel('donation');
const Environment = Utils.loadModel('environment');
const Project = Utils.loadModel('project');
const User = Utils.loadModel('user');
const Lodash = require('lodash');
const http = require('http');

const asyncHandler = require('express-async-handler');

const BIG_TRANSFER_TRESHOLD = 10100;

module.exports = function (app) {
  /*
    sendDonation ep handles 3 cases:
      - small simple donation
      - bigger donation with 3DS verification
      - donation with bank wire transfer
  */
  app.post('/api/sendDonation', Auth.auth(), async function (req, res) {
    try {
      let mangoResult;
      let project = await Project.findById(req.body.projectId);
      if (project.status != 'ACTIVE') throw 'Campaing not active';
      transferType = req.body.type;
      // payIn
      if (transferType == "CARD") {
        mangoResult = await Mango.payIn(req.user, req.body.amount, req.body.cardId);
      } else if (transferType == "BANK_TRANSFER") {
        mangoResult = await Mango.payInByBankTransfer(req.user, req.body.amount);
      } else {
        throw "Unknown transfer type";
      }
      if (mangoResult.Status == 'FAILED') {
        throw result.ResultMessage;
      }
      // creating a new donation in DB
      let donation = await createNewDonation(req, mangoResult);
      // updating giftAid for user
      await updateGiftAid(req);
      // some post actions for different types of donations
      if (transferType == "BANK_TRANSFER") {
        await sendDonationEmail(req.user, donation);
      } else {
        await Mango.deactivateCard(req.body.cardId);
      }
      res.json({
        secureModeNeeded: mangoResult.SecureModeNeeded,
        status: mangoResult.Status,
        redirectUrl: mangoResult.SecureModeRedirectURL,
        donation
      });
    } catch (err) {
      await recordDonationError(Utils.error.toString(err), {
        sendEmail: true,
        user: req.user,
        donationData: req.body
      });
      res.status(400).json(Utils.error.toString(err));
    }
  });

  // This endpoint should be closed in future
  app.post('/api/recordDonationError', asyncHandler(async (req, res) => {
    await recordDonationError(req.body.err, {
      sendEmail: true,
      user: req.user,
      donationData: req.body
    });
    res.send();
  }));

  app.get('/api/payInFailed', asyncHandler(async (req, res) => {
    if (Config.mode == 'stage') {
      await redirectRequestToAllExpEnvironments('/api/payInFailed');
    }
    mangoHookPayInEp(req, res);
  }));

  app.get('/api/payInSucceeded', asyncHandler(async (req, res) => {
    if (Config.mode == 'stage') {
      await redirectRequestToAllExpEnvironments('/api/payInSucceeded');
    }
    mangoHookPayInEp(req, res);
  }));

  app.get('/api/securityReturn', function (req, res) {
    let payInResult;
    getPayIn(req.query.transactionId).then(function (result) {
      payInResult = result;
      if (result.mangoResult.Status != 'SUCCEEDED') {
        throw "Mango 3DS payment failed: " + result.donation._id;
      }
      console.log("Mango 3DS payment succeeded " + JSON.stringify(result));
      return res.redirect(Config.hostname + '/success3Ds.html');
    }).catch(function (err) {
      recordDonationError(err, {
        sendEmail: true,
        is3DS: true,
        user: payInResult.donation._userId,
        donationData: payInResult.donation
      });
      return res.redirect(Config.hostname + '/error3Ds.html');
    });
  });

  app.get('/api/checkDonationStatus/:donationId', Auth.auth(), asyncHandler(async (req, res) => {
    const donation = await Donation.findById(req.params.donationId);
    if (donation) {
      return res.json({status: donation.status});
    } else {
      return res.json({status: 'MISSING'});
    }
  }));

  app.get('/api/preRegisterCard', Auth.auth(), asyncHandler(async (req, res) => {
    const preRegistration = await Mango.preRegisterCard(req.user);
    return res.json(preRegistration);
  }));

  app.get('/api/check3DSSupport/:cardId', Auth.auth(), asyncHandler(async (req, res) => {
    const supported3DS = await Mango.cardSupports3DS(req.params.cardId);
    res.json({
      supported3DS,
      securityTreshold: Mango.securityTreshold
    });
  }));

  app.get('/api/getDonations', Auth.auth(), asyncHandler(async (req, res) => {
    const donations = await Donation.find().populate('_projectId title _userId firstName lastName');
    return res.json(donations);
  }));

  async function redirectRequestToAllExpEnvironments(path) {
    const environments = await Environment.find({});
    for (const environment of environments) {
      const newUrl = environment.url + path;
      console.log('hookRedirection: Resending to ' + environment.url + path);
      await new Promise((resolve) => {
        let req = http.get(newUrl, (res) => {
          console.log(`hookRedirection: Got reponse from ${environment.url}, statusCode: ${res.statusCode}`);
          resolve();
        });

        req.on('timeout', () => {
          console.log('hookRedirection: Time is out ' + environment.url);
          req.abort();
          resolve();
        });

        req.on('error', (err) => {
          console.error('hookRedirection: Error occured ' + environment.url);
          console.error(err);
          resolve();
        });

        req.setTimeout(Config.timeoutForMangoHooksResending);
      });
    }
  }

  async function mangoHookPayInEp(req, res) {
    let savedDonation;
    try {
      const transactionId = req.query.RessourceId;
      let {donation, mangoResult} = await getPayIn(transactionId);
      console.log('Got payIn: ' + JSON.stringify(mangoResult));
      donation.status = await getStatusForDonation(mangoResult);
      savedDonation = await donation.save();

      console.log("Donation changed status to: " + donation.status);
      if (savedDonation.status == 'FAILED') {
        throw 'PayIn failed ' + savedDonation._id;
      }
      if (['CREATED', 'BIG_TRANSFER_CREATED'].includes(savedDonation.status)) {
        let project = await Project.findById(savedDonation._projectId).populate('charity');
        await Mail.sendDonationConfirmation(savedDonation._userId, project, savedDonation);
      }
    } catch (err) {
      console.error('mangoHookPayInEp error');
      console.error(err.toString());
      if (savedDonation) {
        await recordDonationError(err.toString(), {
          sendEmail: false,
          donationData: savedDonation
        });
      } else {
        console.error('Donation is undefined. Can not save error message in DB');
      }
    } finally {
      res.send(); // we should respond with status code 200 in any case to avoid mango hook disabling
    }
  }

  function getPayIn(transactionId) {
    let res = {};
    return Donation.findOne({
      transactionId: transactionId
    }).populate('_userId').exec().then(function (donation) {
      if (donation === null) {
        throw ('No donation for given transactionId: ' + transactionId);
      } else {
        res.donation = donation;
        return Mango.checkTransaction(transactionId);
      }
    }).then(function (mangoResult) {
      res.mangoResult = mangoResult;
      return res;
    });
  }

  async function createNewDonation(req, mangoResult) {
    const status = await getStatusForDonation(mangoResult);
    return await new Donation({
      _userId: req.user._id,
      _projectId: req.body.projectId,
      type: req.body.type,
      amount: req.body.amount,
      createdAt: new Date(),
      transactionId: mangoResult.Id,
      secureModeNeeded: mangoResult.SecureModeNeeded,
      bankTransferData: {
        account: mangoResult.BankAccount,
        wireReference: mangoResult.WireReference
      },
      status
    }).save();
  }

  // this function converts mango result status to donation status
  // donation has a CREATED (or BIG_TRANSFER_CREATED for big amounts) status
  // only when mangoPay payIn was successfully finished
  async function getStatusForDonation(mangoResult) {
    switch (mangoResult.Status) {
      case 'SUCCEEDED':
        if (mangoResult.DebitedFunds.Amount >= BIG_TRANSFER_TRESHOLD) {
          return 'BIG_TRANSFER_CREATED';
        }
        return 'CREATED';
      case 'CREATED':
        if (mangoResult.PaymentType == 'BANK_WIRE') {
          return 'BANK_TRANSFER_REQUESTED';
        }
        return '3DS';
      default:
        return 'FAILED';
    }
  }

  function updateGiftAid(req) {
    if (req.body.giftAid) {
      return User.findByIdAndUpdate(req.user._id, {
        giftAid: true,
        address1: req.body.user.address1,
        address2: req.body.user.address2,
        city: req.body.user.city,
        postCode: req.body.user.postCode
      });
    }
    return Promise.resolve();
  }

  function sendDonationEmail(user, donation) {
    return Project.findById(donation._projectId).populate('charity').then(function (project) {
      switch (donation.type) {
        case 'CARD':
          return Mail.sendDonationConfirmation(user, project, donation);
        case 'BANK_TRANSFER':
          return Mail.sendBankTransferRequestConfirmation(user, project, donation);
        default:
          throw 'Unknown donation type';
      }
    });
  }

  async function recordDonationError(err, opts) {
    console.log("Donation error occured: " + JSON.stringify(err));

    // donation entity has field _projectId but endpoints receive object with projectId
    if (opts.donationData.projectId) {
      opts.donationData._projectId = opts.donationData.projectId;
    }

    // sending error email to donor 
    if (opts && opts.sendEmail && opts.user) {
      let project = await Project.findById(opts.donationData._projectId).populate("charity");
      await Mail.sendDonationError(opts.user, project, err, opts.is3DS);
    }

    // saving err in donation object in DB
    if (opts.donationData._id) {
      await Donation.findByIdAndUpdate(opts.donationData._id, {err: err});
    } else {
      // create new donation in DB to note failure
      // TODO maybe we should create a new entity for errors in future
      let _userId;
      if (opts.user && opts.user._id) {
        _userId = opts.user._id;
      }
      let donationObj = Object.assign(
        Lodash.pick(opts.donationData, ['amount', 'type', '_projectId']),
        {
          err: err,
          status: 'FAILED',
          _userId
        }
      );
      await new Donation(donationObj).save();
    }
  }
};