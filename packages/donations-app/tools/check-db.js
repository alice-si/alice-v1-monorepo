const config = require('../config');
const mongoose = require('mongoose');
const utils = require('../devServer/service/utils');

const user = utils.loadModel('user');
const project = utils.loadModel('project');
const charity = utils.loadModel('charity');
const outcome = utils.loadModel('outcome');
const donation = utils.loadModel('donation');
const validation = utils.loadModel('validation');

// TODO add mangoAccounts checking
// TODO validate statuses enums

let errors = [];
let warnings = [];

const db = process.argv[2] || config.db;
console.log('Checking db: ' + db);

mongoose.connect(db, {useNewUrlParser: true});

check().then(function () {
    console.log('ERRORS FOUND: ' + errors.length);
    console.log('WARNINGS: ' + warnings.length);
    console.log("\x1b[31m"); // enable red color
    console.dir(errors);
    console.log("\x1b[33m");
    console.dir(warnings);
    console.log("\x1b[0m");
});

function check() {
    return checkUsersCryptoField().then(function () {
        console.log('checkProjectsExistence');
        return checkProjectsExistence();
    }).then(function () {
        console.log('checkPilotProjectExistence');
        return checkPilotProjectExistence();
    }).then(function () {
        console.log('checkCharitiesForProjects');
        return checkCharitiesForProjects();
    }).then(function () {
        console.log('checkCharityAdminsNumberForChrities');
        return checkCharityAdminsNumberForChrities();
    }).then(function () {
        console.log('checkDuplicatedReferences');
        return checkDuplicatedReferences();
    }).then(function () {
        console.log('Statuses printing started');
        return printStatusAggregationForModel(project);
    }).then(function () {
        return printStatusAggregationForModel(donation);
    }).then(function () {
        return printStatusAggregationForModel(validation);
    })
}

// Checks if all users have crypto field
function checkUsersCryptoField() {
    return user.find({crypto: null}).then(function (res) {
        if (res.length > 0) {
            const details = res.map(user => user._id + '(' + user.email + ')');
            addWarning('Some users don\'t have crypto field: ' + res.length, details);
        }
    });
}

function checkProjectsExistence() {
    return project.find().then(function (res) {
        if (res.length == 0) {
            addError('There are no projects');
        }
        // TODO check here if campaigns exists
    });
}

function checkPilotProjectExistence() {
    // TODO we should think about keeping pilot project url in config
    return project.find({code: 'mungos-15-lives'}).then(function (res) {
        if (res.length == 0) {
            addError('Pilot project doesn\'t exist');
        }
    });
}

function checkCharitiesForProjects() {
    function checkIfCharityIsValid(charity) {
        return Boolean(charity && charity.code);
    }

    return project.find().populate('charity').then(function (res) {
        res.forEach(function (prj) {
            if (!checkIfCharityIsValid(prj.charity)) {
                addError('Charity is not valid for project: ' + prj._id);
            }
        });
    })
}

function checkCharityAdminsNumberForChrities() {
    return charity.aggregate([
        {
            $lookup: {
                from: 'users',
                let: {charityId: "$_id"},
                pipeline: [
                  {$match: {$expr: {$eq: ["$charityAdmin", "$$charityId"]}}},
                ],
                as: 'admins'
              }
        }
    ]).then(function (res) {
        res.forEach(function (charityObj) {
            if (charityObj.admins.length != 1) {
                addError('Charity ' + charityObj._id + '(' + charityObj.code + ')' + ' has invalid number of admins: ' + charityObj.admins.length);
            }
        });
    })
}

function printStatusAggregationForModel(model) {
    return model.aggregate([{
        $group: {
            _id: '$status',
            count: {$sum: 1}
        }
        }]).then(function(result) {
            console.log(model.modelName + ": " + JSON.stringify(result));
        });
}

function checkDuplicatedReferences() {
    return checkDuplicatedReferencesForProjectInOutcomes();
}

function checkDuplicatedReferencesForProjectInOutcomes() {
    // TODO
    // return project.aggregate();
}

function addError(text, obj) {
    addLog('ERROR', text, obj);
}

function addWarning(text, obj) {
    addLog('WARNING', text, obj);
}

function addLog(type, text, obj = null) {
    const logToAdd = {
        type: type,
        text: text,
        obj: JSON.stringify(obj)
    };
    if (type == 'ERROR') {
        errors.push(logToAdd);
    } else if (type == 'WARNING') {
        warnings.push(logToAdd);
    } else {
        throw 'Unknown type of log';
    }
}