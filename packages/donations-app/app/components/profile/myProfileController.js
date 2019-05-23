angular.module('aliceApp')

  .controller('MyProfileController', ['$rootScope', '$scope', 'AuthService', 'NotificationService', 'UserService', function ($rootScope, $scope, AuthService, NotificationService, UserService) {
    var vm = this;
    vm.update = {};
    vm.user = AuthService.getLoggedUser();
    vm.user.dob = vm.user.dob ? new Date(vm.user.dob) : null;

    angular.copy(vm.user, vm.update);

    vm.submitUpdateProfile = function () {
      vm.profileForm.submitted = true;
      if (vm.profileForm.$valid) {
        UserService.updateUser(vm.update, vm.photo)
          .then(function (response) {
            vm.user = response.data;
            $rootScope.$broadcast('user:login', response.data);
            NotificationService.success("Profile has been successfully updated.");
          });
      }
    };

    return vm;
  }]);