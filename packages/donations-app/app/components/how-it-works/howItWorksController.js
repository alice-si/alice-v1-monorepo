angular.module('aliceApp')
  .controller('HowItWorksController', ['AuthService', '$scope', 'API', 'NotificationService', '$http', '$uibModal', 'MODE', function (AuthService, $scope, API, NotificationService, $http, $uibModal, MODE) {
    var vm = this;

    vm.sendMessage = function () {
      vm.contactForm.$submitted = true;
      if (vm.contactForm.$valid) {
        vm.sending = true;
        $http.post(API + 'contact', vm.contact).then(
          function (response) {
            NotificationService.success('Message has been sent.');
            vm.contact = {};
            vm.contactForm.$submitted = false;
            vm.contactForm.$setUntouched();
            vm.contactForm.$setPristine();
            vm.sending = false;
          }, function (rejection) {
            NotificationService.error('Unfortunately we couldn\'t sent your message.');
            vm.sending = false;
          }
        );
      }
    };

    return vm;
  }]);
