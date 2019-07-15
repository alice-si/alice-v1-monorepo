angular.module('aliceApp')
  .controller('BackofficeController', ['AuthService', '$http', 'API', '$scope', function (AuthService, $http, API, $scope) {
    var vm = this;
    vm.auth = AuthService;
    vm.modes = {
      users : 0,
      donations : 1,
      validations : 2,
      impacts : 3,
    };

    $http.get(API + 'getDonations').then(function (response) {
      vm.donations = response.data;
    });

    $http.get(API + 'getValidations').then(function (result) {
      vm.validations = result.data;
    });

    $http.get(API + 'getImpacts').then(function (result) {
      vm.impacts = result.data;
    });

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
    }

    vm.view = 0;
    vm.changeView = function(view) {
      vm.view = vm.modes[view];
    };

    return vm;
  }])
  .directive('overviewDonationsTable', function() {
    return {
      scope: {
        donations: '=',
      },
      templateUrl: '/components/backoffice/donationsView.html',
    };
  })
  .directive('overviewValidationsTable', function() {
    return {
      scope: {
        validations: '=',
      },
      templateUrl: '/components/backoffice/validationsView.html',
    };
  })
  .directive('overviewImpactsTable', function() {
    return {
      scope: {
        impacts: '=',
      },
      templateUrl: '/components/backoffice/impactsView.html',
    };
  });
