const crypto = require('crypto-js');
const moment = require('moment');
const config = require("../../config");

const SERVICE = 's3';
const SECRET_KEY_PREFIX = 'AWS4';
const REQUEST_NAME = 'aws4_request';
const AMZ_SERVER_ENCRYPTION = 'AES256';
const AMZ_ALGORITHM = 'AWS4-HMAC-SHA256';
const CONTENT_TYPE = 'image/jpeg';
const ACL = 'public-read';
const TIME_BEFORE_EXPIRATION = {number: 3, unit: 'hours'};

function Aws() {
}

Aws.createPolicy = function (filename, dates, bucket) {
  return {
    expiration: dates.expiration,
    conditions: [
      {"acl": ACL},
      {"bucket": bucket},
      {"x-amz-date": dates.withTime},
      {"x-amz-algorithm": AMZ_ALGORITHM},
      {"x-amz-credential": this.getAmzCredentials(dates.date)},
      {"content-type": CONTENT_TYPE},
      {"key": filename},
      {"x-amz-server-side-encryption": AMZ_SERVER_ENCRYPTION}
    ]
  };
};

Aws.evaluateAuthenticationData = function (filename, bucket) {
  if (!bucket) {
    bucket = config.awsDefaultBucketName;
  }
  // dates preparing
  var currentMoment = new moment();
  // date for aws signing
  var date = currentMoment.format('YYYYMMDD');
  var dateWithTime = currentMoment.utc().format("YYYYMMDDTHHmmss") + "Z";
  // expiration date
  var expMoment = currentMoment;
  expMoment.add(TIME_BEFORE_EXPIRATION.number, TIME_BEFORE_EXPIRATION.unit);

  var dates = {withTime: dateWithTime, expiration: expMoment.toDate(), date: date};
  var policy = this.createPolicy(filename, dates, bucket);
  var policyEncoded = encodePolicy(policy);
  var signature = this.sign(policyEncoded, date);
  var postData = getPostData(policy);

  postData['x-amz-signature'] = signature;
  postData.policy = policyEncoded;

  var url = getUrlForBucket(bucket);

  var res = {
    postData: postData,
    url: url,
    link: url + filename
  };

  return res;
};

function getUrlForBucket(bucket) {
  return 'https://' + bucket + '.s3.amazonaws.com/';
}

function getPostData(policy) {
  var postData = Object.assign.apply(Object, policy.conditions);
  return postData;
}

Aws.sign = function (stringToSign, date) {
  var kDate = crypto.HmacSHA256(date, SECRET_KEY_PREFIX + config.awsSecretKey);
  var kRegion = crypto.HmacSHA256(config.awsRegion, kDate);
  var kService = crypto.HmacSHA256(SERVICE, kRegion);
  var kSigning = crypto.HmacSHA256(REQUEST_NAME, kService);

  var signatureWords = crypto.HmacSHA256(stringToSign, kSigning);
  var signatureHex = crypto.enc.Hex.stringify(signatureWords);

  return signatureHex;
};

Aws.getAmzCredentials = function (date) {
  var params = [config.awsAccessKey, date, config.awsRegion, SERVICE, REQUEST_NAME];
  var credentials = params.join('/');
  return credentials;
};

function encodePolicy(policy) {
  return Buffer.from(JSON.stringify(policy)).toString('base64');
}

module.exports = Aws;