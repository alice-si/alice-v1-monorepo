let config = {};

// enum: [dev, stage, prod, local]
const mode = (process.env.ALICE_MODE || "local").toLowerCase();

// This function is used in server.js
config.isProductionMode = function () {
  // because stage should have the same behaviour as production
  return mode == "stage" || mode == "prod";
}

function getEnv(variable, defaultForLocal) {
  if (process.env[variable]) {
    return process.env[variable];
  } else if (defaultForLocal !== undefined && mode === 'local') {
    return defaultForLocal;
  } else {
    throw `Environment variable "${variable}" is missing`;
  }
}

config.mode = mode;

config.awsEmailSenderAddress = getEnv('ALICE_SENDER_EMAIL');
config.awsRegion = 'eu-west-2';
config.awsSesRegion = getEnv('AWS_SES_REGION');
config.awsDefaultBucketName = 'alice-res';

if (mode == 'local') {
  config.pathToKeys = './secrets/keys/';
} else {
  config.pathToKeys = '/etc/alice-secret-volume/';
}

config.hostnames = {
  local: 'http://localhost:8080',
  dev: 'http://dev.alice.si',
  stage: 'https://stage.alice.si',
  prod: 'https://donationsapp.alice.si'
};
config.apiHostnames = {
  local: '',
  dev: 'http://dev.alice.si',
  stage: 'https://api.stage.alice.si',
  prod: 'https://api.alice.si'
};

// set hostname and api for current mode
config.hostname = config.hostnames[mode];
config.api = config.apiHostnames[mode];

if (mode == "prod") {
  config.mangoUrl = 'https://api.mangopay.com';
} else {
  config.mangoUrl = 'https://api.sandbox.mangopay.com';
}

config.db = getEnv('DB_URL');

config.mangoClientId = getEnv('MANGO_CLIENT_ID');
config.mangoPassword = getEnv('MANGO_PASSWORD');
config.technicalMangoUserId = getEnv('TECHNICAL_MANGO_USER_ID');

config.awsAccessKey = getEnv('AWS_S3_ACCESS_KEY');
config.awsSecretKey = getEnv('AWS_S3_SECRET_KEY');

config.secret = getEnv('JWT_SECRET', 'aaa');

module.exports = config;
