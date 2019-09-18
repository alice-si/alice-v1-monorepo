angular.module('aliceApp')

  .controller('ProjectsController', ['AuthService', 'NotificationService', 'ProjectService', '$http', '$state', 'API', 'ETHERSCAN', 'MODE', function (AuthService, NotificationService, ProjectService, $http, $state, API, ETHERSCAN, MODE) {
    var vm = this;
    vm.auth = AuthService;

    vm.ETHERSCAN = ETHERSCAN;
    vm.MODE = MODE;

    vm.startDeployment = function ({ code }) {
      const question =
        `Are you sure you want to deploy the project "${code}" to blockchain?`
        + ` Project status will be changed to "CREATED" and`
        + ` background blockchain jobs will start project deployment.`;
      const successMsg = `Project deployment started for project: ${code}`;
      setProjectStatus(code, 'CREATED', question, successMsg);
    };

    vm.makeActive = function ({ code }) {
      const question =
        `Are you sure you want to make the project "${code}" active?`
        + ` Users will be able to make donations to it.`
      const successMsg = `Project is active now: ${code}`;
      setProjectStatus(code, 'ACTIVE', question, successMsg);
    };

    vm.syncWithStage = function ({ code }) {
      const question =
        `Are you sure you want to sync the project "${code}" with stage?`
        + ` Project fields (except for "validator", "charity", "status" and "ethAddresses")`
        + ` and outcomes will be updated. Please note that it is unsafe to sync active projects`;
      const successMsg = `Project is synced: ${code}`;

      if (confirm(question)) {
        $http.post(API + 'syncProjectWithStage', {
          code,
        }).then(function () {
          NotificationService.success(successMsg);
          $state.reload();
        });
      }
    }

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

    function setProjectStatus(code, status, question, successMsg) {
      if (confirm(question)) {
        $http.post(API + 'setProjectStatus', {
          code,
          status,
        }).then(function () {
          NotificationService.success(successMsg);
          $state.reload();
        });
      }
    }

    return vm;
  }]);
