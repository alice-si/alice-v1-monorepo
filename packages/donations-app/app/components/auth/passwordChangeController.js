angular.module('aliceApp')

  .controller('PasswordChangeController', ['$location', '$state', '$stateParams', 'AuthService', 'NotificationService', function ($location, $state, $stateParams, AuthService, NotificationService) {
    var vm = this;
    vm.credentials = {};

    AuthService.logout();

    vm.credentials.passwordChangeToken = $stateParams.passwordChangeToken;

    vm.changePassword = function () {
      if (vm.passwordChangeForm.$valid) {
        AuthService.changePassword(vm.credentials).then(function (response) {
          NotificationService.success(response.data);
          $state.go('home');
        });
      }
    };

    return vm;
  }]);