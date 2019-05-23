const Monitor = require('./monitor');
const Mongoose = require('mongoose');
const logger = require('./logger')('utils/model-utils');

var ModelUtils = {};

function loadModel(modelName) {
  return require('@alice-si/models/' + modelName)(Mongoose);
}

const Validation = loadModel('validation');
const Donation = loadModel('donation');

// Model loader
ModelUtils.loadModel = loadModel;

// Model getters
ModelUtils.getDonationAndUpdate = function (startStatus, newStatus, dateField) {
  return getModelAndUpdate(Donation, startStatus, newStatus, dateField);
};

ModelUtils.getValidationAndUpdate = function (startStatus, newStatus, dateField) {
  return getModelAndUpdate(Validation, startStatus, newStatus, dateField);
};

ModelUtils.getModelAndUpdate = getModelAndUpdate;

// TODO this function assumes that all models have _userId and _projectId
// fields, which is not true anymore.
function getModelAndUpdate(model, startStatus, newStatus, dateField) {
  var update = {status: newStatus};
  if (dateField) {
    update[dateField] = Date.now();
  }
  return function() {
    return model.findOneAndUpdate({status: startStatus}, update).sort(dateField || '_id').populate('_userId _projectId').then(function (res) {
      Monitor.printStatus(model);
      return res;
    });
  };
}

// Functions for model
ModelUtils.changeStatus = function (modelObj, status) {
  const Model = modelObj.constructor;
  return Model.findByIdAndUpdate(modelObj._id, {status: status}).then(function() {
    logger.info('Status was changed to ' + status);
    Monitor.printStatus(Model);
  });
};

module.exports = ModelUtils;
