angular.module('aliceApp')
  .controller('InfoModalController', ['$scope', function ($scope) {
    let vm = this;

    vm.dismissModal = function() {
      $scope.$dismiss();
    }

    return vm;
  }]);
