angular.module('aliceApp')
  .controller('LoginController', ['$state', '$scope', 'AuthService', 'NotificationService', '$uibModal', '$uibModalStack', 'modalMode', function ($state, $scope, AuthService, NotificationService, $uibModal, $uibModalStack, modalMode) {
    var vm = this;
    vm.credentials = {};
    vm.mode = 'LOGIN'; // enum: ['LOGIN', 'EMAIL_REGISTRATION', 'RESET']
    vm.emailFieldHidden = true;

    vm.action = function () {
      switch (vm.mode) {
        case 'LOGIN':
          vm.login();
          break;
        case 'EMAIL_REGISTRATION':
          vm.registerEmail();
          break;
        case 'RESET':
          vm.resetPassword();
          break;
        default:
          throw `Error: mode is unknonw: ${vm.mode}`;
      }
    };

    if(modalMode) {
      vm.mode = modalMode;
    }

    vm.login = function () {
      AuthService.login(vm.credentials).then(
        function (success) {
          vm.error = false;
          $scope.$dismiss();
        }, function (failure) {
          console.log(failure);
          vm.error = true;
          vm.errorMessage = "Incorrect email or password";
        });
    };

    vm.resetPassword = function () {
      AuthService.resetPassword(vm.credentials).then(
        function (success) {
          vm.error = false;
          NotificationService.success("Password reset link has been sent to: " + vm.credentials.email);
          $scope.$dismiss();
        }, function (failure) {
          vm.error = true;
          vm.error = failure;
        }
      );
    };

    vm.dismissModal = function() {
      $scope.$dismiss();
    }

    vm.startRegistration = function () {
      $scope.$dismiss();
      $uibModal.open({
        templateUrl: '/components/auth/registrationModal.html'
      });
    };

    vm.showEmailField = function () {
      vm.emailFieldHidden = false;
    };

    vm.getTextsForMode = function () {
      switch (vm.mode) {
        case 'LOGIN':
          return {
            button: 'Log in',
            title: 'Log in',
            description: 'Please log in to make a donation or track your gift\'s impact.'
          };
        case 'EMAIL_REGISTRATION':
          return {
            button: 'Use this email',
            title: 'Set your email',
            description: 'Please provide your email address to make a donation.'
          };
        case 'RESET':
          return {
            button: 'Reset password',
            title: 'Reset password',
            description: 'Please provide the email that you used during the registration'
          };
        default:
          throw `Error: mode is unknonw: ${vm.mode}`;
      }
    };

    vm.registerEmail = function () {
      AuthService.registerEmail(vm.credentials.email).then(function () {
        $uibModalStack.dismissAll('Closing modal after registering email');
      }).catch((failure) => {
        console.log(failure.data);
        vm.error = true;
        vm.errorMessage = 'Please log in with this email or use another email address.';
      });
    };

    vm.signUpWithEmail = function (email) {
      $state.go('signup-finishing', {email});
    };

    return vm;
  }]);
