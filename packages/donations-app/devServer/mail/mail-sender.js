// aws will automatically load credentials from env variables:
// AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
const aws = require('aws-sdk'); 
const config = require('../../config');
const mustache = require('mustache');
const promise = require('bluebird');
const fs = promise.promisifyAll(require('fs'));
const utils = require('../service/utils');
const mail = utils.loadModel('mail');


const API_VERSION = '2010-12-01';
const CHARSET = 'UTF-8';

function MailSender() {
}

aws.config.update({region: config.awsSesRegion});

MailSender.requestSending = function (conf) {
  return new promise(function (resolve, reject) {
    readTemplateFilesWithPartials(conf).then(function (content) {
      conf.data.host = config.hostname;
      let newMailRequest = new mail({
        from: config.awsEmailSenderAddress,
        to: conf.to,
        subject: conf.subject,
        html: mustache.render(content.template, conf.data, content.partials),
        type: conf.type
      });
      return newMailRequest.save();
    }).then(function (newMailRequest) {
      console.log("MailSender: mail sending request was saved in DB: " + newMailRequest._id);
      resolve();
    }).catch(function (err) {
      reject(err);
    });
  });
};

function readTemplateFilesWithPartials(conf) {
  const pathToTemplates = __dirname + "/templates/";
  const pathToPartials = pathToTemplates + "partials/";
  let partialKeys = [];
  let result = {
    partials: {}
  };

  return fs.readFileAsync(pathToTemplates + conf.template, "utf8").then(function (template) {
    result.template = template;
    return fs.readdirAsync(pathToPartials);
  }).then(function (partialFiles) {
    let promises = [];
    for (let partialFile of partialFiles) {
      let partialKey = partialFile.replace(".mustache", "");
      partialKeys.push(partialKey);
      promises.push(fs.readFileAsync(pathToPartials + partialFile, "utf8"));
    }
    return promise.all(promises);
  }).then(function (contents) {
    for (let i = 0; i < contents.length; i++) {
      result.partials[partialKeys[i]] = contents[i];
    }
    return result;
  });
}

module.exports = MailSender;




