angular.module('aliceApp')
  .controller('CharityDashboardController', ['AuthService', '$scope', '$http', 'API', '$stateParams',  '$uibModal', function (AuthService, $scope, $http, API, $stateParams, $uibModal) {
    var vm = this;
    vm.auth = AuthService;
    vm.code = $stateParams.project;
    vm.loggedUser = vm.auth.getLoggedUser();
    vm.validated_goals = [];

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
    }

    const MAX_DATE_MARGIN = {number: 1, unit: 'months'};
    const MIN_DATE_MARGIN = {number: -1, unit: 'months'};

    loadGoalsSingle(vm.code);

    function loadGoalsSingle(code) {
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

    function loadGoalsData(activeProject) {
      $http.get(API + 'getGoalsForProjects').then(function (result) {
        vm.projectsWithGoals = result.data;

       vm.projectsWithGoals = vm.projectsWithGoals.map(project => {
         var moments = getMinAndMaxMoments(project);
         var maxCount = 0;

         var chartData = project.outcomes.reduce((acc, outcome) => {
             var line = {color: outcome.color, points: {fillColor: outcome.color}};
             var count = 0;
             line.data = outcome.validations.reduce((acc, validation) => {
                 if (count === 0) {
                   acc.push([moment(validation.time), count++]);
                 }
                 acc.push([moment(validation.time), count++]);
                 return acc;
               },
               []
             );
             maxCount = Math.max(maxCount, count);
             acc.push(line);

             return acc;
           },
           []
         );

         project.chartData = chartData;
         project.chartOptions = prepareGoalsChartOptions(moments.min, moments.max, maxCount);
         return project;
       });
       if(activeProject) {
         vm.projectsWithGoals = vm.projectsWithGoals.filter(project => project.title == activeProject);
       }
     });
    }

    function prepareGoalsChartOptions(minMoment, maxMoment, maxCount) {
      return {
        grid: {
          borderWidth: {top: 0, right: 0, bottom: 1, left: 1},
          borderColor: {left: "#1998a2", bottom: "#1998a2"},
          labelMargin: 10,
          color: "#B7B7B7"
        },
        xaxis: {
          mode: "time",
          minTickSize: [1, "day"],
          monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
          min: minMoment,
          max: maxMoment
        },
        yaxis:
          {
            min: 0,
            max: maxCount + 1,
            tickSize: 1
          },
        series: {
          lines: {show: true, lineWidth: 4},
          points: {show: true, radius: 5, fill: true}
        }
      };
    }

    function getMinAndMaxMoments(project) {
      var moments = project.outcomes.reduce((acc, outcome) => {
          outcome.validations.forEach(function (validation) {
            acc.push(moment(validation.time));
          });
          return acc;
        },
        []
      );

      return {
        min: moment.min(moments).add(MIN_DATE_MARGIN.number, MIN_DATE_MARGIN.unit),
        max: moment.max(moments).add(MAX_DATE_MARGIN.number, MAX_DATE_MARGIN.unit)
      };
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
      controller: 'DashboardDonationsController as donCtrl',
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
