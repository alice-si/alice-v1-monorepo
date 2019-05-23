angular.module('aliceApp')
  .controller('HowItWorksController', ['AuthService', '$scope', '$stateParams', function (AuthService, $scope, $stateParams) {
    var vm = this;
    vm.mode = $stateParams.tab;


    return vm;
  }]);
