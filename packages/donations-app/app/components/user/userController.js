angular.module('aliceApp')

  .controller('UserController', ['$stateParams', 'AuthService', 'ReferenceService', 'UserService', 'ScreeningService', function ($stateParams, AuthService, ReferenceService, UserService, ScreeningService) {
    var vm = this;
    vm.user = {};

    UserService.loadUserDetails($stateParams.userId).then(function (response) {
      angular.extend(vm.user, response.data);
      ReferenceService.fetchUserReferences($stateParams.userId).then(function (response) {
        vm.references = response.data;
      });
    });

    vm.requestScreening = function () {
      ScreeningService.openRequestScreeningModal({
        _screeningTaker: vm.user._id,
        _screeningGiver: AuthService.getLoggedUser()._id
      });
    };

    return vm;
  }]);