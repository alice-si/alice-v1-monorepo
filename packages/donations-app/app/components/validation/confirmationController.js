angular.module('aliceApp')
  .controller(
    'ValidationConfirmationController',
    [
      '$http', '$scope', '$rootScope', 'API', 'NotificationService', 'validation',
      function ($http, $scope, $rootScope, API, NotificationService, validation) {
        let vm = this;
        vm.claimTitle = validation.outcome.title;
        vm.password = '';

        vm.confirm = function () {
          let payload = {
            validationId: validation._id,
            password: vm.password,
          };
          $http.post(API + 'approveClaim', payload).then(response => {
            vm.confirmationError = null;
            $scope.$dismiss();
            NotificationService.success(
              'Claim has been successfully approved.');
            $rootScope.$broadcast('validation');
          }).catch(response => {
            vm.confirmationError = response.data;
          });
        };

        return vm;
    }]);
