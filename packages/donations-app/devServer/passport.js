const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const assert = require('assert');

const Utils = require('./service/utils');
const Config = require('../config');

function checkScope (scope, req) {
  assert(scope == 'donations_only' || scope == 'full_access');

  function epAllowed (req, allowedEndpoints) {
    return allowedEndpoints.reduce((acc, allowedEp) =>
      acc || req.path.startsWith('/api/' + allowedEp), false);
  }

  if (scope == 'donations_only') {
    let allowedEndpoints = [
      'checkDonationStatus',
      'sendDonation',
      'preRegisterCard',
      'check3DSSupport'
    ];
    if (!epAllowed(req, allowedEndpoints)) {
      let err = new Error(`Access denied scope: ${scope}, path: ${req.path}`);
      console.log(err);
      throw err;
    }
  }
}

module.exports = function (passport) {
  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  opts.secretOrKey = Config.secret;
  opts.passReqToCallback = true;
  passport.use(new JwtStrategy(opts, async function (req, jwtPayload, done) {
    try {
      checkScope(jwtPayload.scope, req);
      let user = await Utils.getUserDetailsById(jwtPayload.userId);
      done(null, user);
    } catch (err) {
      console.error('devServer/passport.js error');
      console.error(err);
      done(err, false);
    }
  }));
};
