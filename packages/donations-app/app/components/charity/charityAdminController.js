angular.module('aliceApp')

  .controller('CharityAdminController', ['AuthService', '$http', 'API', '$stateParams', 'NotificationService', '$state', function (AuthService, $http, API, $stateParams, NotificationService, $state) {
    var vm = this;
    vm.auth = AuthService;

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
    }

    if ($stateParams.code) {
      loadData($stateParams.code);
    }

    function loadData(code) {
      $http.get(API + 'getCharity/' + code).then(function (charity) {
        vm.charity = charity.data;
      }, function (err) {
        console.log(err);
        $state.go("404");
      });
    }

    vm.submitSaveCharity = function () {
      vm.charityForm.submitted = true;
      if (vm.charityForm.$valid) {
        $http.post(API + 'saveCharity', vm.charity).then(function (response) {
          NotificationService.success("Charity has been successfully saved.");
          $state.go('charity-admin', {code: response.data.code});
          $state.reload(); // we trigger page reload only after successfull data saving
        });
      }
    };

    return vm;
  }]);