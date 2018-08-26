let ModelUtils = {};

const stages = ['STARTED', 'IN_PROGRESS', 'COMPLETED', 'REVERTED', 'ERROR', 'NOT_STARTED', 'COMPLETED', 'LOST', 'CLEANED']

ModelUtils.evaluateStatuses = function (processNames, statuses) {
    let result = [];
    for (let processName of processNames) {
        for (let stage of stages) {
            result.push(getStatusName(processName, stage));
        }
    }
    return result.concat(statuses);
};

ModelUtils.addDateFields = (processNames, schemaObj) => addFields(processNames, schemaObj, createDateField);

ModelUtils.addTxFields = (processNames, schemaObj) => addFields(processNames, schemaObj, createTxField);

const addFields = (processNames, schemaObj, fieldNameCreator) => {
    for (let processName of processNames) {
        schemaObj[fieldNameCreator(processName)] = Date;
    }
    return schemaObj;
};

const createTxField = process => process + 'Tx';

const createDateField = process => process + 'Time';

const getStatusName = (processName, stage) => processName + '_' + stage;

module.exports = ModelUtils;