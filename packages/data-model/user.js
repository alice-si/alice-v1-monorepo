const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

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
  daiAccount: String,
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

module.exports = ModelUtils.exportModel('User', UserSchema);
