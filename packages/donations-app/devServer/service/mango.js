var Config = require("../../config");
var mangopay = require('mangopay2-nodejs-sdk');

var api = new mangopay({
  clientId: Config.mangoClientId,
  clientPassword: Config.mangoPassword,
  baseUrl: Config.mangoUrl
});

var Mango = {};

Mango.securityTreshold = 30000;
Mango.securityTresholdForCardsWith3DSSupport = 10100;

const supportedCountryCodesFor3DS = [
  'AUT', 'BEL', 'CYP', 'EST', 'FIN', 'FRA', 'DEU', 'GRC', 'IRL', 'ITA', 'LVA',
  'LTU', 'LUX', 'MLT', 'NLD', 'PRT', 'SVK', 'SVN', 'ESP'
];

const TEST_ALIAS = "356999XXXXXX0157";

Mango.convertBirthday = function (dateOfBirth) {
  return (dateOfBirth.getTime() / 1000) - (dateOfBirth.getTimezoneOffset() * 60);
};

// returns mangoUserId for charity
Mango.registerCharity = function (name, representative) {
  return api.Users.create({
    PersonType: "LEGAL",
    LegalPersonType: 'ORGANIZATION',
    Name: name,
    LegalRepresentativeFirstName: representative.firstName,
    LegalRepresentativeLastName: representative.lastName,
    Email: representative.email,
    LegalRepresentativeBirthday: representative.birthday,
    LegalRepresentativeNationality: representative.nationality,
    LegalRepresentativeCountryOfResidence: representative.residence
  }).then(function (mangoUser) {
    console.log("Created mango account: " + mangoUser.Id);
    return Promise.resolve(mangoUser.Id);
  });
};

// project should have populated charity
Mango.registerWalletsForProject = function (project) {
  let wallets = {};
  return api.Wallets.create({
    "Owners": [project.charity.mangoUserId],
    "Description": "Contract Wallet: " + project.code,
    "Currency": "GBP"
  }).then(function (contractWallet) {
    console.log("Created Contract Wallet: " + contractWallet.Id);
    wallets.contractWalletId = contractWallet.Id;
    return api.Wallets.create({
      "Owners": [project.charity.mangoUserId],
      "Description": "Beneficiary Wallet: " + project.code,
      "Currency": "GBP"
    });
  }).then(function (beneficiaryWallet) {
    console.log("Created Beneficiary Wallet: " + beneficiaryWallet.Id);
    wallets.beneficiaryWalletId = beneficiaryWallet.Id;
    return Promise.resolve(wallets);
  });
};

Mango.registerUser = function (user) {
  return api.Users.create({
    "FirstName": user.firstName,
    "LastName": user.lastName,
    "ProofOfIdentity": null,
    "ProofOfAddress": null,
    "PersonType": "NATURAL",
    "Email": user.email,
    "Birthday": Mango.convertBirthday(user.dateOfBirth),
    "Nationality": user.nationality,
    "CountryOfResidence": user.residence
    //New KYC
    //"Birthday": Mango.convertBirthday(user.dateOfBirth),
    //"Nationality": user.nationality,
    //"CountryOfResidence": user.residence,
  }).then(function (mangoUser) {
    if (mangoUser.errors) return Promise.reject(mangoUser.errors);
    console.log("Created mango account: " + mangoUser.Id);
    user.mangoUserId = mangoUser.Id;
    return api.Wallets.create({
      "Owners": [user.mangoUserId],
      "Description": "Donor wallet",
      "Currency": "GBP"
    }).then(function (wallet) {
      if (wallet.errors) return Promise.reject(wallet.errors);
      console.log("Created mango wallet: " + wallet.Id);
      user.mangoWalletId = wallet.Id;
      return Promise.resolve(user);
    });
  });
};

Mango.payIn = async function (user, amount, cardId) {
  const cardSupports3DS = await Mango.cardSupports3DS(cardId);
  let enableSecureMode = false;
  if (cardSupports3DS) {
    enableSecureMode = amount >= Mango.securityTresholdForCardsWith3DSSupport;
  }

  let SecureModeReturnURL;
  if (Config.mode == 'local') {
    // We are not able to test big payments with 3DS locally
    // but even for small payments we should provide some valid url
    SecureModeReturnURL = 'http://anything-can-be-here.com';
  } else {
    SecureModeReturnURL = Config.api + '/api/securityReturn';
  }

  let payInResult = await createPayInInternal(user, amount, {
    DebitedFunds: {
      Currency: "GBP",
      Amount: amount
    },
    Fees: {
      Currency: "GBP",
      Amount: 0
    },
    PaymentType: "CARD",
    CardId: cardId,
    StatementDescription: "Alice.si",
    SecureMode: enableSecureMode ? 'FORCE' : 'DEFAULT',
    SecureModeReturnURL
  });


  return payInResult;
};

Mango.payInByBankTransfer = function (user, amount) {
  return createPayInInternal(user, amount, {
    DeclaredDebitedFunds: {
      Currency: "GBP",
      Amount: amount
    },
    DeclaredFees: {
      Currency: "GBP",
      Amount: 0
    },
    PaymentType: "BANKWIRE",
  });
};

Mango.cardSupports3DS = async function (cardId) {
  const details = await api.Cards.get(cardId);
  return details.Alias == TEST_ALIAS || supportedCountryCodesFor3DS.includes(details.Country);
};

Mango.checkTransaction = function (transactionId) {
  return api.PayIns.get(transactionId);
};

Mango.deactivateCard = function (cardId) {
  return api.Cards.update({
    Id: cardId,
    Active: false
  });
};

Mango.preRegisterCard = function (user) {
  return api.CardRegistrations.create({
    "UserId": user.mangoUserId,
    "Currency": "GBP"
  });
};

Mango.getHooks = function () {
  return api.Hooks.getAll({
    Page: 1,
    Per_Page: 100,
    Sort: 'CreationDate:DESC'
  });
};

Mango.createHook = function (hook) {
  return api.Hooks.create(hook);
};

Mango.updateHook = function (hook) {
  return api.Hooks.update(hook);
};

Mango.createMangoPayinSucceededHook = function (tag, url) {
  return createMangoHook('PAYIN_NORMAL_SUCCEEDED', tag, url);
};

function createPayInInternal(user, amount, conf) {
  let defaultConf = {
    AuthorId: user.mangoUserId,
    // New KYC
    // CreditedUserId: Config.technicalMangoUserId,
    CreditedUserId: user.mangoUserId,
    CreditedWalletId: user.mangoWalletId,
    ExecutionType: "DIRECT",
  };

  return api.PayIns.create(Object.assign(defaultConf, conf));
}

module.exports = Mango;
