const config = require('../config');
const logger = require('../utils/logger')('gateways/mangoProxy');
const mangopay = require('mangopay2-nodejs-sdk');
var SECURITY_THRESHOLD = 5000;

var api = new mangopay({
  clientId: config.mangoClientId,
  clientPassword: config.mangoPassword,
  baseUrl: config.mangoUrl
});

var Mango = {};

// returns mangoUserId for charity
Mango.registerCharity = function (name, representative) {
  return api.Users.create({
    PersonType: 'LEGAL',
    LegalPersonType: 'ORGANIZATION',
    Name: name,
    LegalRepresentativeFirstName: representative.firstName,
    LegalRepresentativeLastName: representative.lastName,
    Email: representative.email,
    LegalRepresentativeBirthday: representative.birthday,
    LegalRepresentativeNationality: representative.nationality,
    LegalRepresentativeCountryOfResidence: representative.residence
  }).then(function (mangoUser) {
    logger.info('Created mango account: ' + mangoUser.Id);
    return Promise.resolve(mangoUser.Id);
  });
};

// project should have populated charity
Mango.registerWalletsForProject = function (project) {
  let wallets = {};
  return api.Wallets.create({
    'Owners': [project.charity.mangoUserId],
    'Description': 'Contract Wallet: ' + project.code,
    'Currency': 'GBP'
  }).then(function (contractWallet) {
    logger.info('Created Contract Wallet: ' + contractWallet.Id);
    wallets.contractWalletId = contractWallet.Id;
    return api.Wallets.create({
      'Owners': [project.charity.mangoUserId],
      'Description': 'Beneficiary Wallet: ' + project.code,
      'Currency': 'GBP'
    });
  }).then(function (beneficiaryWallet) {
    logger.info('Created Beneficiary Wallet: ' + beneficiaryWallet.Id);
    wallets.beneficiaryWalletId = beneficiaryWallet.Id;
    return Promise.resolve(wallets);
  });
};

// This function is used only in regiter-tramonex tool - maybe we should remove it
Mango.registerLegalUser = function (name, walletDescription, representative) {
  return api.Users.create({
    PersonType: 'LEGAL',
    LegalPersonType: 'ORGANIZATION',
    Name: name,
    LegalRepresentativeFirstName: representative.firstName,
    LegalRepresentativeLastName: representative.lastName,
    Email: representative.email,
    LegalRepresentativeBirthday: representative.birthday,
    LegalRepresentativeNationality: representative.nationality,
    LegalRepresentativeCountryOfResidence: representative.residence
  }).then(function (mangoUser) {
    logger.info('Created mango user: ' + mangoUser.Id);
    return api.Wallets.create({
      'Owners': [mangoUser.Id],
      'Description': walletDescription,
      'Currency': 'GBP'
    });
  }).then(function (wallet) {
    logger.info('Created Wallet: ' + wallet.Id);
    return Promise.resolve();
  }).catch(function (err) {
    logger.error('Error: ' + err);
  });
};

Mango.registerUser = function (user) {
  logger.info('MangoProxy: user creating started');
  return api.Users.create({
    'FirstName': user.firstName,
    'LastName': user.lastName,
    'ProofOfIdentity': null,
    'ProofOfAddress': null,
    'PersonType': 'NATURAL',
    'Email': user.email,
    'Birthday': (user.dateOfBirth.getTime() / 1000 - user.dateOfBirth.getTimezoneOffset() * 60),
    'Nationality': user.nationality,
    'CountryOfResidence': user.residence
  }).then(function (mangoUser) {
    logger.info((user.dateOfBirth.getTime() / 1000 - user.dateOfBirth.getTimezoneOffset() * 60));
    if (mangoUser.errors) return Promise.reject(mangoUser.errors);
    logger.info('Created mango account: ' + mangoUser.Id);
    user.mangoUserId = mangoUser.Id;
    return api.Wallets.create({
      'Owners': [user.mangoUserId],
      'Description': 'Donor wallet',
      'Currency': 'GBP'
    }).then(function (wallet) {
      if (wallet.errors) return Promise.reject(wallet.errors);
      logger.info('Created mango wallet: ' + wallet.Id);
      user.mangoWalletId = wallet.Id;
      return Promise.resolve(user);
    });
  }).catch(function (err) {
    logger.error(err);
    throw err;
  });
};

Mango.checkBalance = function (walletId) {
  return api.Wallets.get(walletId).then(function (wallet) {
    logger.info('Checking balance of wallet: ' + walletId);
    return Promise.resolve(wallet.Balance.Amount);
  });
};

Mango.checkTransaction = function (transactionId) {
  return api.PayIns.get(transactionId);
};

Mango.transfer = function (fromMangoUserId, fromMangoWalletId, toMangoUserId, toMangoWalletId, amount) {
  return api.Transfers.create({
    Tag: 'collecting',
    AuthorId: fromMangoUserId,
    // Old KYC
    // CreditedUserId: toMangoUserId,
    // New KYC
    CreditedUserId: config.technicalMangoUserId,
    DebitedFunds: {
      'Currency': 'GBP',
      'Amount': amount
    },
    'Fees': {
      'Currency': 'GBP',
      'Amount': 0
    },
    DebitedWalletId: fromMangoWalletId,
    CreditedWalletId: toMangoWalletId
  });
};

Mango.payOut = function (userId, walletId, bankAccountId, amount, reference, tag) {
  var payOut = {
    AuthorId: userId,
    DebitedWalletId: walletId,
    CreditedUserId: userId,
    Tag: tag,
    DebitedFunds: {
      Amount: amount,
      Currency: 'GBP'
    },
    Fees: {
      Amount: 0,
      Currency: 'GBP'
    },
    BankAccountId: bankAccountId,
    BankWireRef: reference,
    PaymentType: 'BANK_WIRE'
  };
  var result = api.PayOuts.create(payOut);
  return result.status == 'FAILED' ? Promise.reject(result.ResultMessage) : Promise.resolve(result);
};


Mango.payIn = function (user, amount, cardId) {
  return api.PayIns.create({
    AuthorId: user.mangoUserId,
    CreditedUserId: config.technicalMangoUserId,
    CreditedWalletId: user.mangoWalletId,
    DebitedFunds: {
      Currency: 'GBP',
      Amount: amount
    },
    Fees: {
      Currency: 'GBP',
      Amount: 0
    },
    PaymentType: 'CARD',
    ExecutionType: 'DIRECT',
    CardId: cardId,
    StatementDescription: 'Alice.si',
    SecureModeReturnURL: 'http://localhost:8080/api/securityReturn',
    SecureMode: amount > SECURITY_THRESHOLD ? 'FORCE' : 'DEFAULT'
  });
};

Mango.preRegisterCard = function (user) {
  return api.CardRegistrations.create({
    'UserId': user.mangoUserId,
    'Currency': 'GBP'
  });
};

Mango.updateCardRegistration = function (registeredData) {
  return api.CardRegistrations.update(registeredData);
};

module.exports = Mango;
