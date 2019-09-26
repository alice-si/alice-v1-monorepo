angular.module('aliceApp')

  .controller('LogInAsAnotherUserController', ['AuthService', function (AuthService) {
    var vm = this;

    vm.email = '';

    vm.logInAsAnotherUser = function () {
      AuthService.logInAsAnotherUser(vm.email);
    };

    return vm;
  }]);