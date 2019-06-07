angular.module('aliceApp')
  .controller('CharityDashboardController', ['AuthService', '$scope', '$http', 'API', '$stateParams', '$uibModal', function (AuthService, $scope, $http, API, $stateParams, $uibModal) {
    var vm = this;
    vm.auth = AuthService;
    vm.code = $stateParams.project;
    vm.loggedUser = vm.auth.getLoggedUser();
    vm.validated_outcomes = [];

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
    }

    loadGoalsFromProject(vm.code);

    function loadGoalsFromProject(code) {
      $http.get(API + `getImpactsForProject/${code}`).then(function (result) {
        vm.projectWithGoals = result.data;
        if(vm.projectWithGoals) {
          if(vm.projectWithGoals.current_project) {
            vm.project = result.data.current_project;
          }
          vm.general_outcomes = vm.projectWithGoals.goals;
          vm.donated_outcomes = _.map(vm.projectWithGoals.donated, function(item) {
            return _.extend(item, _.findWhere(vm.projectWithGoals.validated, { _id: item._id }));
          });
          vm.donated_outcomes.forEach((e) => {
            // Not checking for amount because it's a compulsory field
            e.progressInUnits = e.outcome[0].costPerUnit ? (e.totalValidated / e.outcome[0].costPerUnit) : 0;
            // e.percentage = (e.totalValidated) ? 100 * (e.totalValidated / e.outcome[0].amount) : 0;
            e.percentage = (e.progressInUnits / e.outcome[0].target) * 100;
            e.outcome[0].lightColor = convertHex(e.outcome[0].color, 0.35);
            vm.validated_outcomes.push(e);
            // e.percentage = 100 * (e.totalValidated / e.outcome[0].amount);
          });
          vm.projectValidator = vm.projectWithGoals.projectValidator;
        }
      });
    }

    function convertHex(hex, opacity) {
      hex = hex.replace('#','');
      let r = parseInt(hex.substring(0,2), 16);
      let g = parseInt(hex.substring(2,4), 16);
      let b = parseInt(hex.substring(4,6), 16);

      let result = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
      return result;
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
        outcomesDonatedTo: '=',
        outcomesValidated: '=',
        outcomesOfProject: '=',
        projectValidator: '=',
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
  .directive('charityDashboardDonationsGraph', function() {
    return {
      templateUrl: '/components/dashboard/panels/donationsGraph.html',
      controller: 'CharityDashboardDonationsController as donCtrl',
    };
  })
  .directive('charityDashboardDonationsTable', function() {
    return {
      templateUrl: '/components/dashboard/panels/donationsTable.html',
      controller: 'CharityDashboardDonationsController as donCtrl',
    };
  })
  .directive('goalProgressBar', function() {
    return {
      scope: {
        color: '=',
        progressInUnits: '=',
        percentage: '=',
        outcome: '=',
      },
      templateUrl: '/components/dashboard/panels/goalProgressBar.html',
    };
  })
  .directive('goalsBreakdownTable', function() {
    return {
      scope: {
        outcomes: '=',
      },
      templateUrl: '/components/dashboard/panels/goalsBreakdownTable.html'
    };
  })
  .directive('claimOutcomeCard', () => {
    return {
      templateUrl: '/components/dashboard/panels/claimOutcomeCard.html',
      scope: {
        outcome: '=',
        validator: '=',
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
