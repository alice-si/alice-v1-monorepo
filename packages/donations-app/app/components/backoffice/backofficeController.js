angular.module('aliceApp')
  .controller('BackofficeController', ['$http', 'API', function ($http, API) {
    var vm = this;

    $http.get(API + 'getDonations').then(function (response) {
      vm.donations = response.data;
    });

    $http.get(API + 'getValidations').then(function (result) {
      vm.validations = result.data;
    });

    $http.get(API + 'getImpacts').then(function (result) {
      vm.impacts = result.data;
    });

    return vm;
  }]);