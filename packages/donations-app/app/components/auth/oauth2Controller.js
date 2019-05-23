angular.module('aliceApp')
  .controller('Oauth2Controller', ['API', 'AuthService', '$rootScope', '$http', function (API, AuthService, $rootScope, $http) {
    let vm = this;
    vm.auth = AuthService;
    vm.showQuestion = false;

    let urlParams = new URLSearchParams(window.location.search);

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
    } else {
      loadData();
    }

    $rootScope.$on('user:login', function (event, data) {
      loadData();
    });

    vm.redirect = function(err, accessCode) {
      let redirectUrl = urlParams.get('redirect_uri');
      let getParamsToAdd = {
        'access_code': accessCode,
        'status': 'SUCCEED',
        'state': urlParams.get('state')
      };
      if (err) {
        getParamsToAdd.err = err;
        getParamsToAdd.status = 'FAILED';
      }
      window.location.replace(addGetParamsToUrl(redirectUrl, getParamsToAdd));
    };

    vm.requestAccess = function () {
      $http.post(API + 'oauth2/requestAccessCode', {
        scope: 'donations_only',
        redirectUrl: urlParams.get('redirect_uri'),
        charityId: urlParams.get('client_id')
      }).then(function (result) {
        if (result.data && result.data.accessCode) {
          vm.redirect(null, result.data.accessCode);
        } else {
          vm.redirect('Access request failed');
        }
      }, function (err) {
        console.log(err);
        vm.redirect(err);
      });
    };

    function addGetParamsToUrl(redirectUrl, params) {
      let newUrl = new URL(redirectUrl);
      for (let paramName in params) {
        let paramValue = params[paramName];
        newUrl.searchParams.append(paramName, paramValue);
      }
      return newUrl.toString();
    }

    function loadData() {
      vm.showQuestion = true;
      let charityId = urlParams.get('client_id');
      $http.get(API + 'charities/' + charityId).then(function (res) {
        vm.charityName = res.data.name;
      }, function (err) {
        vm.redirect(err);
      });
    }

    return vm;

  }]);