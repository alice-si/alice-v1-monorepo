angular.module('aliceApp')

  .controller('RegistrationController', ['$scope', 'AuthService', '$uibModal', function ($scope, AuthService, $uibModal) {
    var vm = this;
    vm.credentials = {};
    vm.registration = {
      agreeAlice: true
    };
    vm.mode = 'REGISTRATION'; // enum: ['REGISTRATION', 'REGISTRATION_FININSHING']
    if (AuthService.getEmailForSignupFinishing()) {
      vm.registration.email = AuthService.getEmailForSignupFinishing();
      vm.mode = 'REGISTRATION_FINISHING';
    }

    vm.register = function () {
      vm.registrationForm.$submitted = true;
      if (vm.registrationForm.$valid) {
        vm.signing = true;
        AuthService.register(vm.registration).then(
          function (success) {
            vm.signing = false;
            AuthService.login(vm.registration).then(function (success) {
              $scope.$dismiss();
              if (!AuthService.hasAfterLoginFunction()) {
                $uibModal.open({
                  templateUrl: '/components/auth/registrationConfirmationModal.html'
                });
              }
            });
          }, function (failure) {
            vm.signing = false;
            console.log(failure.data);
            vm.duplicatedEmail = vm.registration.email;
          });
      }
    };


    return vm;
  }]);
