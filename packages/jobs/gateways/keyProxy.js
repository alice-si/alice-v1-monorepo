const {readFileSync} = require('fs');
const Crypto = require('crypto');
const Config = require('../config');

let KeyProxy = {};

const pub = getKey('alice.pub');
const priv = getKey('alice.pem');

KeyProxy.encrypt = function (str) {
  return Crypto.publicEncrypt(pub, Buffer.from(str)).toString('base64');
};

KeyProxy.decrypt = function (str) {
  return Crypto.privateDecrypt(priv, Buffer.from(str, 'base64')).toString();
};

function getKey (fileName) {
  const path = Config.pathToKeys + fileName;
  return readFileSync(path);
}

module.exports = KeyProxy;