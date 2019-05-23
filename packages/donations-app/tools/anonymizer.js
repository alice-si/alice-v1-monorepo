const config = require('../config');
const mongoose = require('mongoose');
const utils = require('../devServer/service/utils');

const user = utils.loadModel('user');

const db = process.argv[2] || config.db;
console.log('Connecting to db: ' + db);
mongoose.connect(db, {useNewUrlParser: true});

const prefix = "Doe_";

function findCurrentIndex() {
  var max = 0;
  return user.find().then(function (res) {
    res.forEach(function (user) {
      if (user.lastName && user.lastName.indexOf(prefix) >= 0) {
        let numeric = user.lastName.replace(prefix, "");
        max = Math.max(max, parseInt(numeric));
      }
    });
    return max + 1;
  });
}

function anonymize() {
  findCurrentIndex().then(function (index) {
    console.log("Start anonymization index: " + index);
    return user.find().then(function (res) {
      res.forEach(function (user) {
        if (user.lastName && user.lastName.indexOf(prefix) == -1) {
          console.log("A: " + user.lastName + " -> " + prefix + index);
          user.lastName = prefix + index;
          user.save();
          index++;
        }
      });
    })
  })
};

anonymize();
