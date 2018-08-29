const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');
const bcrypt = require('bcrypt');

let Schema = Mongoose.Schema;

let UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  crypto: String,
  changedCrypto: String,
  firstName: String,
  lastName: String,
  nationality: String,
  residence: String,
  dateOfBirth: Date,
  registeredAt: Date,
  agreeContact: Boolean,
  photo: String,
  passwordChangeToken: String,
  ethAccount: String,
  mangoUserId: String,
  mangoWalletId: String,
  validator: [{
    type: Schema.ObjectId,
    ref: "Project"
  }],
  charityAdmin: {
    type: Schema.ObjectId,
    ref: "Charity"
  },
  superadmin: Boolean,
  giftAid: Boolean,
  agreeAlice: Boolean,
  address1: String,
  address2: String,
  city: String,
  postCode: String
});

UserSchema.methods.comparePassword = function (passw, cb) {
  bcrypt.compare(passw, this.password, function (err, isMatch) {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

module.exports = ModelUtils.exportModel('User', UserSchema);