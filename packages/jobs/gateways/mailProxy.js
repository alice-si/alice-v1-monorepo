// aws will automatically load credentials from env variables:
// AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
const aws = require('aws-sdk');
const config = require('../config');
const mustache = require('mustache');
const promise = require('bluebird');
const utils = require('../utils/model-utils');
const logger = require('../utils/logger')('gateways/mailProxy');
const mail = utils.loadModel('mail');
const fs = promise.promisifyAll(require('fs'));

const API_VERSION = '2010-12-01';
const CHARSET = 'UTF-8';

var MailProxy = {};

aws.config.update({region: config.awsSesRegion});

MailProxy.requestSending = function (conf) {
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
      logger.info('MailProxy: mail sending request was saved in DB: ' + newMailRequest._id);
      resolve();
    }).catch(function (err) {
      reject(err);
    });
  });
};


MailProxy.send = function (mail) {
  if (isTestMail(mail)) {
    return Promise.resolve();
  }

  return new promise(function (resolve, reject) {
    var params = {
      Destination: {
        CcAddresses: getCC(mail),
        ToAddresses: getRecipients(mail)
      },
      Message: {
        Body: {
          Html: {
            Charset: CHARSET,
            Data: mail.html
          }
        },
        Subject: {
          Charset: CHARSET,
          Data: getSubject(mail)
        }
      },
      Source: mail.from,
      ReplyToAddresses: [],
    };
    var sendPromise = new aws.SES({apiVersion: API_VERSION}).sendEmail(params).promise();

    sendPromise.then(
      function (data) {
        logger.info('Mail sent: ' + data.MessageId);
        resolve(data);
      }).catch(
      function (err) {
        logger.error('Error occured: ' + JSON.stringify(err));
        reject(err);
      });
  });
};

function getSubject(mail) {
  if (config.mode != 'PROD') {
    return '[' + config.mode + '] ' + mail.subject;
  } else {
    return mail.subject;
  }
}

function getCC(mail) {
  if (mail.type == 'ErrorNotification' || mail.type == 'StalledDonationsNotification') {
    return [];
  } else {
    return [mail.from];
  }
}

function getRecipients(mail) {
  return [].concat(mail.to);
}

function isTestMail(mail) {
  return mail.to.length > 0
    && mail.to[0].includes('test_mail')
    && mail.to[0].includes('alice.si');
}

function readTemplateFilesWithPartials(conf) {
  const pathToTemplates = __dirname + '/../templates/';
  const pathToPartials = pathToTemplates + 'partials/';
  let result = {
    partials: {}
  };

  return fs.readFileAsync(pathToTemplates + conf.template, 'utf8').then(function (template) {
    result.template = template;
    return fs.readdirAsync(pathToPartials);
  }).then(function (partialFiles) {
    let promises = [];
    for (let partialFile of partialFiles) {
      let partialKey = partialFile.replace('.mustache', '');
      let readFilePromise = fs.readFileAsync(pathToPartials + partialFile, 'utf8').then(function (content) {
        result.partials[partialKey] = content;
      });
      promises.push(readFilePromise);
    }
    return promise.all(promises);
  }).then(function () {
    return result;
  });
}

module.exports = MailProxy;
