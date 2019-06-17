angular.module('aliceApp')
  .controller(
    'ImpactClaimController',
    [
      '$http', '$scope', '$rootScope', 'API', 'NotificationService', 'outcome', 'quantity',
      function ($http, $scope, $rootScope, API, NotificationService, outcome, quantity) {
        let vm = this;
        vm.password = '';

        vm.claim = function () {
          let payload = {
            outcomeId: outcome._id,
            quantity: quantity,
            password: vm.password,
          };
          $http.post(API + 'claimOutcome', payload).then(response => {
            vm.confirmationError = null;
            $scope.$dismiss();
            NotificationService.success(
              'Claim has been successfully made.');
              $rootScope.$broadcast('outcome');
          }).catch(response => {
            vm.confirmationError = response.data;
          });
        };

        return vm;
    }]);
