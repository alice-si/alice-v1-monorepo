const mongoose = require('mongoose');

const config = require('../config');
const KeyProxy = require('../gateways/keyProxy');
const ModelUtils = require('../utils/model-utils');
const ContractUtils = require('../utils/contract-utils');

const User = ModelUtils.loadModel('user');
const Project = ModelUtils.loadModel('project');
const Charity = ModelUtils.loadModel('charity');
const EthAddress = ModelUtils.loadModel('ethAddress');

async function main() {
  await connectToDB();

  let report = {};

  const projects = await Project.find();
  for (let project of projects) {
    if (!project.ethAddresses) {
      report[project.code] = 'Project does not contain ethAddresses';
    } else {
      report[project.code] = await getReportForProject(project);
    }
  }

  // Result printing
  console.log('Printing the result');
  console.log("====================================================");
  console.log(JSON.stringify(report, null, 2));
  console.log("====================================================");
}

async function getReportForProject(project) {
  let result = {};
  for (let ethAddressName of ['owner', 'validator', 'beneficiary']) {
    let address = project.ethAddresses[ethAddressName];
    console.log(`Preparing result for project: "${project.code}" ${ethAddressName}`);
    result[ethAddressName] = {
      address,
      info: await getAddressInfo(address)
    };
  }
  return result;
}

async function getAddressInfo(address) {
  if (equalAddresses(address, config.mainAccount)) {
    return 'Main eth account';
  } else {
    let addressRegex = getAddressRegex(address);
    let addressInfo = {};

    // We also may check if address is saved correctly
    let ethAddressesInDB = await EthAddress.find({
      address: addressRegex
    });
    await saveReportData(ethAddressesInDB, prepareEthAddressesReport,
      'DB.ethAddresses.address', addressInfo);

    // Users with the address
    let usersWithAddress = await User.find({
      ethAccount: addressRegex
    });
    await saveReportData(usersWithAddress, prepareUsersForReport,
      'DB.users.ethAccount', addressInfo);

    // Users with the address saved in ethAccountOld field
    let usersWithOldAddress = await User.find({
      ethAccountOld: addressRegex
    });
    await saveReportData(usersWithOldAddress, prepareUsersForReport,
      'DB.users.ethAccountOld', addressInfo);

    // Charities with the address
    let charitiesWithAddress = await Charity.find({
      ethAccount: addressRegex
    });
    await saveReportData(charitiesWithAddress, prepareCharitiesForReport,
      'DB.charities.ethAccount', addressInfo);

    return addressInfo;
  }
}

async function saveReportData(resultFound, prepareFunction, fieldName, resObjToUpdate) {
  const report = await prepareFunction(resultFound);
  if (report && report.length > 0) {
    resObjToUpdate[fieldName] = report;
  }
}

async function prepareEthAddressesReport(ethAddresses) {
  let result = [];
  for (let ethAddress of ethAddresses) {
    let wallet;

    if (ethAddress.index) {
      wallet = ContractUtils.getWalletForIndex(ethAddress.index);
    } else if (ethAddress.privateKey) {
      try {
        let privateKey = KeyProxy.decrypt(ethAddress.privateKey);
        wallet = ContractUtils.getWalletFromPrivateKey(privateKey);
      } catch (e) {
        console.error(`Private key encryption failed for ${ethAddress.privateKey}`);
        console.error(e);
        wallet.address = 'can not get private key';
      }
    }

    let newEthAddress = {
      _id: ethAddress._id,
      privateKey: ethAddress.privateKey,
      index: ethAddress.index,
    }

    if (wallet) {
      newEthAddress['VALID'] = equalAddresses(wallet.address, ethAddress.address);
    } else {
      newEthAddress['WARNING'] = "No index or private key";
    }

    result.push(newEthAddress);
  }
  return result;
}

function prepareUsersForReport(users) {
  return users.map(user => {
    let decryptedPassword;
    try {
      decryptedPassword = KeyProxy.decrypt(user.crypto);
    } catch (e) {
      console.error(`Error occured in password decryption for key: "${user.crypto}"`);
      console.log(`User: ${user.email}`);
      console.error(e);
    }

    let newUser = {
      _id: user._id,
      email: user.email,
      password: decryptedPassword,
    };

    return newUser;
  });
}

async function prepareCharitiesForReport(charities) {
  let result = [];
  for (let charity of charities) {
    let charityAdmins = await User.find({
      charityAdmin: charity._id
    });
    charityAdmins = prepareUsersForReport(charityAdmins);

    let newCharity = {
      _id: charity._id,
      code: charity.code,
      charityAdmins
    };
    result.push(newCharity);
  }
  return result;
}

function getAddressRegex(address) {
  return { $regex : new RegExp(address, "i") };
}

function equalAddresses(addr1, addr2) {
  return addr1 && addr2 && (addr1.toLowerCase() == addr2.toLowerCase());
}

async function connectToDB() {
  console.log(`Connecting to DB: ${config.db}`);
  await mongoose.connect(config.db, {useNewUrlParser: true});
}

main().then(() => {
  console.log('Finished successfully');
  process.exit();
}).catch(err => {
  console.error(`Error occured: ${err}`);
  process.exit();
});