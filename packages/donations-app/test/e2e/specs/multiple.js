var Logout = require('./partials/logout');
var Donate = require('./partials/donate');
var Register = require('./partials/register');
var Login = require('./partials/login');

for (var i = 0; i < browser.params.count; i++) {
  (function (i) {
    describe('Iteration ' + i, function () {
      it('Log iteration', function () {
        console.log("\nIteration: " + i);
      });

      Register.test();
      Donate.test();
      Logout.test();
      Login.test();
      Logout.test();

    });
  })(i);
}