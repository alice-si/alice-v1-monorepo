angular.module('aliceApp')
  .controller('CharityDashboardController', ['AuthService', '$scope', '$http', 'API', '$stateParams', '$uibModal', function (AuthService, $scope, $http, API, $stateParams, $uibModal) {
    var vm = this;
    vm.auth = AuthService;
    vm.code = $stateParams.project;
    vm.loggedUser = vm.auth.getLoggedUser();
    vm.validated_goals = [];

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
    }

    loadGoalsFromProject(vm.code);

    function loadGoalsFromProject(code) {
      $http.get(API + `getImpactsForProject/${code}`).then(function (result) {
        vm.projectWithGoals = result.data;
        if(vm.projectWithGoals.current_project) {
          vm.project = result.data.current_project;
        }
        vm.outcomes = _.map(vm.projectWithGoals.donated, function(item) {
          return _.extend(item, _.findWhere(vm.projectWithGoals.validated, { _id: item._id }));
        });
        vm.outcomes.forEach((e) => {
          // Not checking for amount because it's a compulsory field
          e.percentage = (e.totalValidated) ? 100 * (e.totalValidated / e.outcome[0].amount) : 0;
          if(e.percentage >= 100) {
            vm.validated_goals.push(e);
            e.percentage = 0;
          }
        });
      });
    }

    return vm;
  }])
  .directive('charityDashboardMoney', function() {
    return {
      scope: {
        donations: '=',
      },
      templateUrl: '/components/dashboard/tabs/charityDashboardMoney.html'
    };
  })
  .directive('charityDashboardGoals', function() {
    return {
      scope: {
        goals: '=',
      },
      templateUrl: '/components/dashboard/tabs/charityDashboardGoals.html'
    };
  })
  .directive('charityDashboardPeople', function() {
    return {
      scope: {
        people: '=',
      },
      templateUrl: '/components/dashboard/tabs/charityDashboardPeople.html'
    };
  })
  .directive('charityDashboardDonations', function() {
    return {
      templateUrl: '/components/dashboard/tabs/charityDashboardDonationsGraph.html',
      controller: 'CharityDashboardDonationsController as donCtrl',
    };
  })
  .directive('verticalProgressBar', function() {
    return {
      scope: {
        color: '=',
        percentage: '=',
        outcomeTitle: '=',
      },
      templateUrl: '/components/dashboard/panels/verticalProgressBar.html',
    };
  })
  .directive('breakdownTable', function() {
    return {
      scope: {
        outcomes: '=',
      },
      templateUrl: '/components/dashboard/panels/breakdownTable.html'
    };
  })
  .directive('claimOutcomeCard', () => {
    return {
      templateUrl: '/components/dashboard/panels/claimOutcomeCard.html',
      scope: {
        outcome: '=',
      },
      controller: ['$scope', '$uibModal', function($scope, $uibModal) {
        // Claiming function for a validation
        $scope.claimFn = function(outcome, quantity) {
          let modal = $uibModal.open({
            templateUrl: '/components/global/claimModal.html',
            controller: 'ImpactClaimController as claimCtrl',
            resolve: {
              outcome: () => outcome,
              quantity: () => quantity,
            }
          });
        };
      }],
    };
  });