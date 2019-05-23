/*
 * Sets 'validator' field of users to an empty array if they are not validators.
 */

const MongoClient = require('mongodb').MongoClient;

const config = require('../config');

const dbConnString = process.argv[2] || config.db;
console.log(`Running on ${dbConnString}`);

async function up(client) {
  let db = client.db();
  await db.collection('users').updateMany(
    { validator: {$eq: null} },
    { $set: { validator: [] }}
  );
}

async function run() {
  let client = await MongoClient.connect(dbConnString, {useNewUrlParser: true});
  try {
    up(client);
  } finally {
    closeClient(client);
  }
}

async function closeClient(client) {
  await client.close();
}

run().then(
    () => {
      console.log('Finished successfully!');
    },
    err => {
      throw err;
      console.error(`Failed to apply the migration:\n${err}`);
    });

