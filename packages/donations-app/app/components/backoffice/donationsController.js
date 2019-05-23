angular.module('aliceApp')
  .controller('DonationsController', ['$http', 'API', function ($http, API) {
    var vm = this;

    $http.get(API + 'getDonations').then(function (response) {
      vm.donations = response.data;
    });

    return vm;
  }]);