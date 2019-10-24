const { readFileSync } = require('fs');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');

const resolvers = require('./resolvers');

const typeDefs = readFileSync(path.resolve(__dirname, 'schema.graphql'), 'utf8');

module.exports = makeExecutableSchema({
  typeDefs,
  resolvers,
});
