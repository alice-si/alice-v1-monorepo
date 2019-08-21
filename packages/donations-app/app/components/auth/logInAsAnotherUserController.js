angular.module('aliceApp')

  .controller('LogInAsAnotherUserController', ['AuthService', function (AuthService) {
    var vm = this;

    vm.email = 'rpn@globaladvisors.co.uk';

    vm.logInAsAnotherUser = function () {
      AuthService.logInAsAnotherUser(vm.email);
    };

    return vm;
  }]);