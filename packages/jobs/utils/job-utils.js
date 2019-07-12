const EthProxy = require('../gateways/ethProxy');
const ModelUtils = require('./model-utils');
const MailUtils = require('./mail-utils');
const Monitor = require('./monitor');
const logger = require('./logger')('utils/job-utils');

// THIS MODULE IS DEPRECATED - to create new jobs please use jobs/Job.js

var JobUtils = {};

JobUtils.createJob = function (conf) {
  validateJobConfiguration(conf);
  if (conf.modelless) {
    return createModellessJob(conf);
  }
  var result = {};
  if (conf.createChecker) {
    result.check = createChecker(conf);
  }
  result.execute = createExecutor(conf);

  return result;
};

function createModellessJob(conf) {
  return {
    execute: function () {
      let jobContext = {};
      const jobId = createJobId(conf.processName + '_modelles_executor');

      jobContext.msg = (msg) => logger.info(jobId + ': ' + msg);
      jobContext.errMsg = (msg) => logger.error(jobId + ': ' + msg);
      jobContext.errorBehaviour = (err) => jobContext.errMsg(err);
      jobContext.completedBehaviour = () => jobContext.msg('finished successfully');

      jobContext.msg('Started...');
      conf.action(jobContext);
    }
  };
}

function createExecutor(conf) {
  const executorJobPrefix = conf.processName + '_executor_job';

  function mainAction(jobContext) {
    jobContext.inProgressBehaviour = function (tx) {
      jobContext.model[getTxField(conf)] = tx;
      jobContext.model[getTimeField(conf)] = Date.now();
      jobContext.model.status = getInProgressStatus(conf);
      jobContext.msg('Changing status to: ' + getInProgressStatus(conf));
      return jobContext.model.save().then(function() {
        Monitor.printStatus(jobContext.model.constructor);
      });
    };

    jobContext.errorBehaviour = function (err) {
      jobContext.errMsg(`Error occured: ${err.toString()} ${err.stack}`);
      return MailUtils.sendErrorNotification('executorJobError', {
        name: executorJobPrefix,
        model: jobContext.model
      }, err).then(function () {
        return ModelUtils.changeStatus(jobContext.model, getErrorStatus(conf));
      });
    };

    jobContext.completedBehaviour = function () {
      jobContext.msg('Completed: ' + jobContext.model._id);
      return ModelUtils.changeStatus(jobContext.model, getCompletedStatus(conf));
    };

    return conf.action(jobContext);
  }
  return createJobInternal(executorJobPrefix, getModelGetterForExecutor(conf), mainAction);
}

function createChecker(conf) {
  const minAgeForChecking = 10;
  const minAgeForEtherscanChecking = 300;
  const checkerJobPrefix = conf.processName + '_checker_job';

  function modelGetter() {
    return conf.model.findOne({status: getInProgressStatus(conf)}).sort(getTimeField(conf));
  }

  function mainAction(jobContext) {
    var age = getAge(conf, jobContext.model);
    var tx = getTx(conf, jobContext.model);
    var id = jobContext.model._id;
    var modelName = getModelName(conf);

    if (tx == null) {
      if (age < minAgeForChecking) {
        jobContext.msg(getTxField(conf) + ' is null. Skipping...');
        return;
      } else {
        return ModelUtils.changeStatus(jobContext.model, getCleanedStatus(conf));
      }
    }

    jobContext.msg('Start checking: ' + id);
    return EthProxy.checkTransaction(tx).then(function (receipt) {
      if (receipt != null) {
        if (EthProxy.checkTransactionReceipt(receipt)) {
          jobContext.msg(conf.processName + ' was completed, tx: ' + tx);
          return ModelUtils.changeStatus(jobContext.model, getCompletedStatus(conf));
        } else {
          jobContext.msg(conf.processName + ' was reverted, tx: ' + tx);
          return ModelUtils.changeStatus(jobContext.model, getRevertedStatus(conf));
        }
      } else if (age > minAgeForEtherscanChecking) {
        if (!EthProxy.checkTransactionWithEtherscan(tx)) {
          jobContext.msg('No trace on etherscan: ' + tx);
          return ModelUtils.changeStatus(jobContext.model, getLostStatus(conf));
        }
      }
    }).catch(function (err) {
      jobContext.errMsg('Error while checking ' + modelName + ': ' + err);
      return MailUtils.sendErrorNotification('checkerJobError', {
        name: checkerJobPrefix,
        model: jobContext.model
      }, err).then(function () {
        return ModelUtils.changeStatus(jobContext.model, getErrorStatus(conf));
      });
    });
  }

  return createJobInternal(checkerJobPrefix, modelGetter, mainAction);
}

function createJobInternal(jobIdPrefix, modelGetter, action) {
  return function() {
    const jobId = createJobId(jobIdPrefix);

    function jobMsg(msg) {
      logger.info(jobId + ': ' + msg);
    }
    function jobErrMsg(msg) {
      logger.error(jobId + ': ' + msg);
    }
    jobMsg('started');
    return modelGetter().then(function(model) {
      if (model) {
        jobMsg('Model was found. processing... ' + model._id);
        let initialJobContext = {
          model: model,
          msg: jobMsg,
          errMsg: jobErrMsg
        };
        return action(initialJobContext);
      } else {
        jobMsg('no model found. skipping...');
      }
    }).catch(function(err) {
      MailUtils.sendErrorNotification('jobInternalError', {name: jobIdPrefix}, err);
      jobErrMsg(`Error during executing job: ${err.toString()} ${err.stack}`);
    });
  };
}

function getModelGetterForExecutor(conf) {
  if (conf.modelGetter) {
    return conf.modelGetter;
  }
  return ModelUtils.getModelAndUpdate(conf.model, conf.startStatus, getStartedStatus(conf), conf.dateField);
}

function getAge(conf, model) {
  var time = model[getTimeField(conf)];
  return (time && Date.now() - time) / 1000;
}

function getTx(conf, model) {
  return model[getTxField((conf))];
}

function getModelName(conf) {
  return conf.model.collection.collectionName;
}

// Status getters

function getCleanedStatus(conf) {
  return getStatus(conf, '_CLEANED');
}

function getLostStatus(conf) {
  return getStatus(conf, '_LOST');
}

function getCompletedStatus(conf) {
  if (conf.completedStatus) {
    return conf.completedStatus;
  }
  return getStatus(conf, '_COMPLETED');
}

function getRevertedStatus(conf) {
  return getStatus(conf, '_REVERTED');
}

function getInProgressStatus(conf) {
  return getStatus(conf, '_IN_PROGRESS');
}

function getStartedStatus(conf) {
  return getStatus(conf, '_STARTED');
}

function getErrorStatus(conf) {
  return getStatus(conf, '_ERROR');
}

function getStatus(conf, postfix) {
  return conf.processName.toUpperCase() + postfix;
}

// Field names getters

function getTxField(conf) {
  if (conf.txField) {
    return conf.txField;
  }
  return conf.processName.toLowerCase() + 'Tx';
}

function getTimeField(conf) {
  if (conf.timeField) {
    return conf.timeField;
  }
  return conf.processName.toLowerCase() + 'Time';
}

// TODO add more checks
function validateJobConfiguration(conf) {
  if (conf.modelless) {
    if (!conf.processName) {
      throw 'Modelles job should have at least processName field';
    }
  } else {
    var requiredFields = ['processName', 'createChecker', 'action'];

    requiredFields.forEach(field => {
      if (!conf.hasOwnProperty(field)) {
        throw 'Job configuration does not have the following property: ' + field;
      }
    });

    if (!conf.hasOwnProperty('startStatus') && !conf.hasOwnProperty('modelGetter')) {
      throw 'Job configuration does not have any of the following properties: startStatus, modelGetter';
    }
  }
}

function createJobId(prefix) {
  return prefix.toLowerCase() + '_' + Date.now();
}

module.exports = JobUtils;
