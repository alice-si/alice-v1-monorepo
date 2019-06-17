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

          console.log(vm.projectWithGoals.validated);

          vm.projectWithGoals.validated.forEach((item) => {
            // Not checking for amount because it's a compulsory field
            item.progressInUnits = item.outcome[0].costPerUnit ? (
              Math.floor(item.totalValidated / item.outcome[0].costPerUnit)) : 0;
            // Have to decide which one we want as the percentage!!
            item.percentage = (item.totalValidated) ?
              Math.floor(100 * (item.totalValidated / item.outcome[0].amount)) : 0;
            // item.percentage = (item.progressInUnits / item.outcome[0].target) * 100;
            if(item.outcome[0].color) {
              item.outcome[0].lightColor = convertHex(item.outcome[0].color, 0.35);
            }
          });

          vm.validated_outcomes = vm.projectWithGoals.validated;

          vm.donated_outcomes = _.map(vm.general_outcomes, function(item) {
            return _.extend(item, _.findWhere(vm.projectWithGoals.validated, { _id: item._id }));
          });
          vm.projectValidator = vm.projectWithGoals.projectValidator;
        }
      });
      $http.get(API + `getDonationsForProject/${code}`).then(function (result) {
        if(result.data) {
          vm.projectWithGoals.donations = result.data[0].donations;
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
