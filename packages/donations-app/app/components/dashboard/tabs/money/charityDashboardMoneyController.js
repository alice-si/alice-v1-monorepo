angular.module('aliceApp')
  .controller('CharityDashboardMoneyController', ['AuthService', '$http', 'API', 'Excel', '$stateParams', '$scope', '$filter', function (AuthService, $http, API, Excel, $stateParams, $scope, $filter) {
    var vm = this;
    vm.auth = AuthService;
    vm.code = $stateParams.project;

    return vm;
  }]);
