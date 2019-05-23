const config = require('../config');
const mango = require('../devServer/service/mango');
const lodash = require('lodash');

// To add a new hook for mango just add it to this object
const hooksToSet = {
    failedPayIn: {
        Tag: "PayinFailedHook for " + config.api,
        Url: config.api + "/api/payInFailed",
        EventType: 'PAYIN_NORMAL_FAILED',
        Status: 'ENABLED',
    },
    succeededPayIn: {
        Tag: "PayinSucceededHook for " + config.api,
        Url: config.api + "/api/payInSucceeded",
        EventType: 'PAYIN_NORMAL_SUCCEEDED',
        Status: 'ENABLED',
    }
};

// Hooks creating
module.exports = function () {
    return mango.getHooks().then(function (hooks) {
        let promises = [];
        console.log('Hooks fetched ' + JSON.stringify(hooks));
        for (let hookName in hooksToSet) {
            let hookToSet = hooksToSet[hookName];
            existingHook = hooks.find(hook => hook.EventType == hookToSet.EventType);
            if (existingHook) {
                if (lodash.isEqual(lodash.pick(existingHook, Object.keys(hookToSet)), hookToSet)) {
                    console.log(existingHook.Tag + ' already exists. Skipping...');
                } else {
                    console.log('Updating hook: ' + hookToSet.Tag);
                    hookToSet.Id = existingHook.Id;
                    promises.push(mango.updateHook(hookToSet));
                }
            } else {
                console.log('Creating ' + hookToSet.Tag + ' started...');
                promises.push(mango.createHook(hookToSet));
            }
        }
    
        return Promise.all(promises);
    });
};
