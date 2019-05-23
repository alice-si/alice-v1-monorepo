angular.module('aliceApp')

  .controller('ProjectsController', ['AuthService', '$http', 'API', function (AuthService, $http, API) {
    var vm = this;
    vm.auth = AuthService;
  
    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
      loadData();
    }

    loadData();

    function loadData() {
      $http.get(API + 'getProjectsForAdmin').then(function (projects) {
        vm.projects = projects.data;
      });
    }

    return vm;
  }]);
