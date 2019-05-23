const requiredFields = [
    "db",
    "api",
    "mangoClientId",
    "mangoPassword",
    "mangoUrl",
    "hostname",
    "secret",
    "awsRegion",
    "awsDefaultBucketName",
    "awsAccessKey",
    "awsSecretKey",
    "awsEmailSenderAddress",
    "technicalMangoUserId"
];

function ConfigValidator () {}

ConfigValidator.validate = function(config) {
    requiredFields.forEach(field => {
        if (!config.hasOwnProperty(field)) {
            throw "Config does not have the following property: " + field;
        }
    });
}

module.exports = ConfigValidator;