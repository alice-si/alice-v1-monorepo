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

Monitor.printStatus = async function(model) {
  let result = await Monitor.getAggregatedResult(model);
  logger.info(model.modelName + ': ' + JSON.stringify(result));
};

module.exports = Monitor;

