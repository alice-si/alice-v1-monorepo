const graphlHTTP = require('express-graphql');
const schema = require('../graphql/schema');

module.exports = function (app) {
  app.use('/graphql', graphlHTTP({
    schema,
    graphiql: true
  }));
};
