module.exports = function (app) {
  require('./controller/project')(app);
  require('./controller/authentication')(app);
  require('./controller/user')(app);
  require('./controller/utils')(app);
  require('./controller/donation')(app);
  require('./controller/impact')(app);
  require('./controller/validation')(app);
  require('./controller/dashboard')(app);
  require('./controller/geek')(app);
  require('./controller/charity')(app);
  require('./controller/environment')(app);

};