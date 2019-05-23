const Passport = require('passport');
const Bcrypt = require('bcrypt');
const Jwt = require('jsonwebtoken');
const Utils = require('./utils');
const Random = require('./random');
const Config = require('../../config');

const JWT_TTL = 7200; // seconds

let Auth = {};

Auth.auth = function () {
  return Passport.authenticate('jwt', {session: false});
};

Auth.getEncryptedRandomKey = async function () {
  const randomKey = Random.randomLetters(32);
  const encrypted = await Utils.crypto.encrypt(randomKey);
  return encrypted;
};

Auth.hashPassword = async function (password) {
  let hash = await Bcrypt.hash(password, 10);
  return hash;
};

Auth.comparePassword = function (user, hash) {
  return Bcrypt.compare(hash, user.password);
};

Auth.getJWT = function (userId, {
  expiresIn = JWT_TTL,
  scope
}) {
  const jwtPayload = {userId, scope};
  const token = 'JWT ' + Jwt.sign(jwtPayload, Config.secret, {expiresIn});
  return token;
};

module.exports = Auth;

