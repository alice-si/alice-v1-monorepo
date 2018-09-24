const ModelUtils = require('../model-utils');
const should = require('chai').should();
const Mongoose = require('mongoose');

describe('Model-utils', function () {
    let processNames = ['TEST', 'NEW_TEST'];
    let evalautedStatuses = ModelUtils.evaluateStatuses(processNames, ['TTT'])
    it('Should evaluate statuses', function () {
        for (let status of ['TEST_STARTED', 'TEST_COMPLETED', 'TEST_IN_PROGRESS', 'TEST_ERROR', 'NEW_TEST_LOST']) {
            evalautedStatuses.should.include(status);
        }
        evalautedStatuses.should.include('TTT');
        evalautedStatuses.should.not.include('TTT_IN_PROGRESS');
    });

    it('Should add fields', function () {
        let schemaObj = {};
        ModelUtils.addDateFields(processNames, schemaObj);
        ModelUtils.addTxFields(processNames, schemaObj);
        schemaObj.should.have.all.keys('testTime', 'testTx', 'new_testTime', 'new_testTx');
        schemaObj.testTime.should.be.equal(Date);
        schemaObj.testTx.should.be.equal(String);
    });
});

describe('Donation fields', function () {
    const Donation = require('../donation')(Mongoose);
    testTxAndDateFields('Validation', Donation, ['mintingTime', 'depositingTime', 'collectingTx', 'mintingTx']);
    const enums = prepareEnums(['MINTING', 'DEPOSITING', 'COLLECTING']).concat(['3DS', 'CREATED', 'DONATED']);
    testStatusEnum('Donation', Donation, enums);
});

describe('Validation fields', function () {
    const Validation = require('../validation')(Mongoose);
    const enums = prepareEnums(['VALIDATING', 'LINKING', 'IMPACT_FETCHING']).concat(['CREATED']);
    testTxAndDateFields('Validation', Validation, ['validatingTime', 'impact_fetchingTime', 'linkingTx', 'validatingTx']);
    testStatusEnum('Validation', Validation, enums);

    let validation = new Validation({});
    validation.linkingTransactions.push('0x0');
    validation.linkingTransactions.push('0x1');
    it('should have linking transactions', function () {
        validation.linkingTransactions.should.include('0x1');
        validation.linkingTransactions.should.include('0x0');
    });
});

describe('Test model initializing', function () {
    const names = ['category', 'charity', 'donation', 'impact', 'mail', 'outcome', 'project', 'projectHistory', 'user', 'validation'];
    for (let name of names) {
        testModelInit(name);
    }
});

function testModelInit(name) {
    it('Should init model ' + name, function () {
        const model = require('../' + name)(Mongoose);
    })
}

function testStatusEnum(name, model, enums) {
    let schema = model.schema.obj;
    it(name + ' should have enum checkers for status field', function () {
        for (let enumChecker of enums) {
            console.log('Testing enum: ' + enumChecker);
            schema.status.enum.should.include(enumChecker);
        }
    });
}

function prepareEnums(processes) {
    const stages = ['STARTED', 'IN_PROGRESS', 'COMPLETED', 'REVERTED', 'ERROR', 'NOT_STARTED', 'COMPLETED', 'LOST', 'CLEANED'];
    let result = [];
    for (let stage of stages) {
        for (let process of processes) {
            result.push(process + '_' + stage);
        }
    }
    return result;
}

function testTxAndDateFields(name, model, fields) {
    let schema = model.schema.obj;
    it(name + ' should have tx and date fields', function () {
        for (let field of fields) {
            schema.should.have.property(field);
        }
    });
}