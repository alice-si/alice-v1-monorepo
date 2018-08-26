const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

let Schema = mongoose.Schema;
let pub = null;

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
    ref: "Campaign"
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

UserSchema.pre('save', function (next) {
  tryToInitPubKey();
  var user = this;
  if (pub && this.password && (this.isModified('password') || this.isNew)) {
    var encrypted = pub.encrypt(user.password, 'utf8', 'base64');
    if (this.isNew) {
      user.crypto = encrypted;
    } else {
      user.changedCrypto = encrypted;
    }
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});

function tryToInitPubKey() {
  const pathToKey = '../keys/alice.pub';
  if (!pub && fs.existsSync(pathToKey)) {
    pub = ursa.openSshPublicKey(fs.readFileSync(pathToKey, 'utf8'), 'base64')
  }
}

module.exports = Mongoose.model('User', UserSchema);