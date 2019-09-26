let config = {};

let mode = process.env.ALICE_MODE;
const isLocal = !['EXP', 'STAGE', 'PROD'].includes(mode);
if (isLocal) {
  mode = 'LOCAL';
}

function getEnv(variable, defaultVal) {
  if (process.env[variable]) {
    return process.env[variable];
  } else if (defaultVal !== undefined) {
    return defaultVal;
  } else {
    throw `Environment variable "${variable}" is missing`;
  }
}

config.mangoClientId = getEnv('MANGO_CLIENT_ID');
config.mangoPassword = getEnv('MANGO_PASSWORD');
config.technicalMangoUserId = getEnv('TECHNICAL_MANGO_USER_ID');
config.mangoUrl = 'https://api.sandbox.mangopay.com';

config.mainAccount = getEnv('ETH_MAIN_ACCOUNT');

config.ethEndpointUrl = getEnv('ETH_ENDPOINT_URL', 'http://localhost:8545');
config.networkName = getEnv('ETH_NETWORK_NAME', 'local'); // enum: ['local', 'rinkeby', 'main'];

config.minimalBalance = '0.01'; // minimal balance for accounts that send transactions
config.defaultLoadAmount = '0.05';
config.enableAutoNonce = true;

config.mode = mode;
config.logLevel = 'debug'; // enum ['debug', 'info', 'warn', 'error']

// Mockgoose is used in tests, so a connection string is not needed.
config.db = getEnv('DB_URL', '');
config.pathToKeys = getEnv('PATH_TO_KEYS', './secrets/keys/');
config.awsEmailSenderAddress = getEnv('ALICE_SENDER_EMAIL');
config.accountUnlockTtl = 10000;     // seconds
config.repeatedErrorTimeout = 3600;  // seconds
config.stalledDonationTimeout = 900; // seconds
config.awsSesRegion = getEnv('AWS_SES_REGION');
config.hostname = getEnv('HOSTNAME', 'http://dev.alice.localdomain');
config.developerEmails = getEnv('ALICE_DEVELOPER_EMAILS').split(',');

if (mode == 'STAGE') {
  config.claimsRegistryAddress = '0x226B638D19eBA95998D30eF31Cb0CCD0d7f7b7F0';
}
if (mode == 'PROD') {
  config.claimsRegistryAddress = null;
  config.mangoUrl = 'https://api.mangopay.com';
}

config.mnemonic = getEnv('MNEMONIC_KEY');

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw 'Config does not have credentials required for AWS SES';
}

module.exports = config;
