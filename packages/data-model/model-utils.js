let ModelUtils = {};

const stages = ['STARTED', 'IN_PROGRESS', 'COMPLETED', 'REVERTED', 'ERROR', 'NOT_STARTED', 'COMPLETED', 'LOST', 'CLEANED']

// schemaModifier is an optional function
// it should be used if you want to interact with another models instances
ModelUtils.exportModel = function(name, schema, schemaModifier = null) {
    return function (mongooseInstance) {
        if (schemaModifier) {
            schemaModifier(schema, mongooseInstance);
        }
        return mongooseInstance.model(name, schema);
    };
};

ModelUtils.evaluateStatuses = function (processNames, statuses) {
    let result = [];
    for (let processName of processNames) {
        for (let stage of stages) {
            result.push(getStatusName(processName, stage));
        }
    }
    return result.concat(statuses);
};

ModelUtils.addDateFields = (processNames, schemaObj) => addFields(processNames, schemaObj, createDateField, Date);

ModelUtils.addTxFields = (processNames, schemaObj) => addFields(processNames, schemaObj, createTxField, String);

const addFields = (processNames, schemaObj, fieldNameCreator, type) => {
    for (let processName of processNames) {
        schemaObj[fieldNameCreator(processName)] = type;
    }
    return schemaObj;
};

const createTxField = process => process.toLowerCase() + 'Tx';

const createDateField = process => process.toLowerCase() + 'Time';

const getStatusName = (processName, stage) => processName + '_' + stage;

module.exports = ModelUtils;