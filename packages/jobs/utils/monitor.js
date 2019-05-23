const logger = require('./logger')('utils/monitor');

function Monitor(){}

Monitor.getAggregatedResult = function (model) {
  return model.aggregate([{
    $group: {
      _id: '$status',  //$region is the column name in collection
      count: {$sum: 1}
    }
  }]);
};

Monitor.printStatus = function(model) {
  Monitor.getAggregatedResult(model).then(function(result) {
    logger.info(model.modelName + ': ' + JSON.stringify(result));
  });
};

module.exports = Monitor;

