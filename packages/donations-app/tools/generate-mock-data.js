const random = require('random-name');
const mongoose = require('mongoose');

const Utils = require('../devServer/service/utils');

const User = Utils.loadModel('user');
const Donation = Utils.loadModel('donation');
const Project = Utils.loadModel('project');

const NUMBER_OF_USERS = 10;
const NUMBER_OF_DONATIONS_PER_USER = 3;

const projectCode = process.argv[2];
const db = process.argv[3];
if (!db) {
  throw 'USAGE: node tools/generate-random-users.js <PROJECT_CODE> <DB_URL>';
}

run(db, projectCode);

async function run(db, projectCode) {
  await mongoose.connect(db, {useNewUrlParser: true});
  console.log(`Mongoose connected to ${db}`);

  const project = await getProject(projectCode);
  if (!project) {
    throw `Project with the code: ${projectCode} was not found`;
  }

  for (let i = 0; i < NUMBER_OF_USERS; i++) {
    let firstName = random.first();
    let lastName = random.last();
    let email = `${firstName}.${lastName}@alice.si`;
    let user = await new User({ firstName, lastName, email }).save();
    console.log(`User created: ${user.email} (${i + 1}/${NUMBER_OF_USERS})`);

    await addDonationsForUser(user._id, project._id);
    console.log(`Donations created for user: ${user.email}`);
  }

  console.log('DONE!');
  process.exit();
}

async function addDonationsForUser(userId, projectId) {
  for (let i = 0; i < NUMBER_OF_DONATIONS_PER_USER; i++) {
    await addDonationForUser(userId, projectId);
  }
}

async function addDonationForUser(userId, projectId) {
  await new Donation({
    _userId: userId,
    _projectId: projectId,
    amount: getRandomAmount(),
    createdAt: getRandomDate(),
    type: 'CARD',
    status: 'DONATED',
  }).save();
}

function getRandomAmount() {
  return getRandomInt(10, 1000);
}

function getRandomDate() {
  return new Date(Date.now() - getRandomInt(0, 100 * 3600 * 24 * 90));
}

function getRandomInt(min, max) {
  return min + Math.floor(Math.random() * Math.floor(max));
}

function getProject(projectCode) {
  return Project.findOne({ code: projectCode });
}