angular.module('aliceApp')

  .controller('CharitiesController', ['AuthService', '$http', 'API', '$stateParams', 'NotificationService', '$state', function (AuthService, $http, API, $stateParams, NotificationService, $state) {
    var vm = this;
    vm.auth = AuthService;

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
      loadData();
    }

    loadData();

    function loadData() {
      $http.get(API + 'getCharitiesForAdmin').then(function (charities) {
        vm.charities = charities.data;
      });
    }

    return vm;
  }]);
