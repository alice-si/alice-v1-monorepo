const Config = require('../config');
const Mongoose = require('mongoose');
const Utils = require('../devServer/service/utils');
const Mango = require('../devServer/service/mango');

const User = Utils.loadModel('user');

const db = process.argv[2] || Config.db;
console.log('Connecting to db: ' + db);
Mongoose.connect(db, {useNewUrlParser: true});

fixMangopayAccounts();

async function fixMangopayAccounts() {
  const users = await User.find({});
  let counter = 0;
  const usersNumber = users.length;
  for (let user of users) {
    console.log(`----------------- Processing user ${user.email} ${++counter}/${usersNumber} -----------------`)
    const isAccountCorrect = await isMangopayAccountCorrect(user);
    if (!isAccountCorrect) {
      console.log(`Mangopay accounts for user ${user.email} are incorrect`);
      await updateMangopayAccounts(user);
    } else {
      console.log(`Mangopay accounts for user ${user.email} are correct`);
    }
  }
}

async function isMangopayAccountCorrect(user) {
  if (!user.mangoUserId || !user.mangoWalletId) {
    return false;
  } else {
    // Trying to preregister card using mangopay api
    try {
      await Mango.preRegisterCard(user);
    } catch (err) {
      return false;
    }
    return true;
  }
}

async function updateMangopayAccounts(user) {
  try {
    console.log(`Updating mangopay accounts for user: ${user.email}`);
    user = await Mango.registerUser(user);
    await new User(user).save();
  } catch (err) {
    console.log(`Unexpected error: ${Utils.error.toString(err)}`);
  }
}