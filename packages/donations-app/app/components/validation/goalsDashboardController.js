angular.module('aliceApp')
  .controller(
    'GoalsDashboardController',
    [
      '$http', '$scope', '$stateParams', '$uibModal', 'API', 'AuthService',
      function ($http, $scope, $stateParams, $uibModal, API, AuthService) {
        let vm = this;
        let projectCode = $stateParams.project;

        vm.loggedUser = null;
        vm.project = null;
        vm.validations = {
          ready: [],
          noFunds: [],
          processingValidation: [],
          validated: [],
        };

        loadProject();
        updateUser();
        $scope.$on('user:login', updateUser);

        vm.approve = function(validation) {
          let modal = $uibModal.open({
            templateUrl: '/components/global/confirmationModal.html',
            controller: 'ValidationConfirmationController as confirmationCtrl',
            resolve: {
              validation: () => validation
            }
          });

          modal.result.then(loadGoals).catch(loadGoals);
        };

        function loadProject() {
          let url = `${API}projects/${projectCode}?countValidations=true`;
          $http.get(url).then(result => {
            vm.project = result.data;
            loadGoals();
          });
        }

        function loadGoals() {
          if (!vm.loggedUser || !vm.loggedUser._id || !vm.project) return;

          let url = API + `projects/${projectCode}/validations`;
          $http.get(url).then(result => {
            vm.validations = result.data;
            vm.validations.ready = [];
            vm.validations.noFunds = [];

            for (let validation of vm.validations.claimed) {
              if (vm.project.amountAvailable >= validation.outcome.amount) {
                vm.validations.ready.push(validation);
              } else {
                vm.validations.noFunds.push(validation);
              }
            }
          });
        }

        function updateUser() {
          vm.loggedUser = AuthService.getLoggedUser();
          loadGoals();
        }

        return vm;
      }
    ])
  .directive('goalCard', () => {
    return {
      templateUrl: '/components/validation/goalCard.html',
      scope: {
        'goal': '=',
        'approveFn': '&?',
        'fundsAvailable': '=',
        'inProgress': '=',
        'noFunds': '=',
      },
      controller: ['$scope', function GoalCardController($scope) {
        $scope.showDescription = false;
      }],
    };
  });
