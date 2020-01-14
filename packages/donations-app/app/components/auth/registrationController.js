angular.module('aliceApp')

  .controller('RegistrationController', ['$scope', 'AuthService', '$uibModal', function ($scope, AuthService, $uibModal) {
    var vm = this;
    vm.credentials = {};
    vm.registration = {
      agreeAlice: true,
      agreeContact: false,
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
        extendContactAgreement();
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

    vm.dismissModal = function() {
      $scope.$dismiss();
    }

    vm.startLogin = function (mode) {
      $scope.$dismiss();
      $uibModal.open({
        templateUrl: '/components/auth/loginModal.html',
        controller: 'LoginController',
        controllerAs : 'loginCtrl',
        resolve: {
            modalMode : function() {
                 return mode
            }
        }
      });
    };

    let extendContactAgreement = function() {
      vm.registration.agreeAlice = vm.registration.agreeContact;
    }

    return vm;
  }]);
