angular.module('aliceApp')

  .controller('ProjectsController', ['AuthService', 'NotificationService', '$http', '$state', 'API', 'ETHERSCAN', function (AuthService, NotificationService, $http, $state, API, ETHERSCAN) {
    var vm = this;
    vm.auth = AuthService;

    vm.ETHERSCAN = ETHERSCAN;

    vm.changeStatusToCreated = function ({ code }) {
      const question =
        `Are you sure you want to deploy the project "${code}" to blockchain.`
        + ` Project status will be changed to "CREATED" and`
        + ` background blockchain jobs will start project deployment.`;
      if (confirm(question)) {
        $http.post(API + 'setProjectStatus', {
          code,
          status: 'CREATED'
        }).then(function () {
          NotificationService.success(`Project deployment started for project: ${code}`);
          $state.reload();
        });
      }
    };

    vm.noAddresseForProject = function ({ code }) {
      NotificationService.error(`Project "${code}" does not have an ethAddress`);
    }

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
