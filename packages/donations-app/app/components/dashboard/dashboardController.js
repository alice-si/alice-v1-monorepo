angular.module('aliceApp')
  .controller('DashboardController', ['$scope', 'AuthService', '$http', 'API', '$stateParams', function ($scope, AuthService, $http, API, $stateParams) {
    var vm = this;
    vm.auth = AuthService;
    vm.mode = 0;
    vm.projectSelected = [];
    /*jshint -W030 */
    vm.activeProject;

    const modes = { 'OVERALL' : 0, 'SINGULAR' : 1, 'DONATIONS': 2, 'GOALS': 3 };

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
    }

    $http.get(API + 'getProjectsForMain').then(function (result) {
      vm.projectsForMain = result.data;
      vm.projectsForMain.forEach(project => {
        if (project.upfrontPayment) {
          project.received += (project.donated * project.upfrontPayment / 100);
        }
        if (project.donated) {
          project.receivedPercentage = 100 * project.received / project.donated;
          project.receivedRelGoal = 100 * project.received / project.fundingTarget;
        } else {
          project.receivedPercentage = 0;
          project.receivedRelGoal = 0;
        }
        if (project.fundingTarget > 0) {
          project.raisedPercentage = 100 * project.donated / project.fundingTarget;
        } else {
          project.raisedPercentage = 0;
        }
      });
    });

    vm.setProject = function(project, mode) {
      if(project) {
        vm.activeProject = project;
        vm.setMode(mode);
      }
    };

    vm.setMode = function(mode) {
      if(mode !== undefined) {
        vm.mode = modes[mode];
      }
    };

    vm.selectProject = function(code) {
      if(code) {
        if(vm.projectSelected !== undefined) {
          if(vm.projectSelected.includes(code)) {
            vm.projectSelected.splice(vm.projectSelected.indexOf(code), 1);
          }
          else {
            vm.projectSelected.push(code);
          }
        }
      }
    };

    return vm;
  }])
  .directive('dashboardOverview', function() {
    return {
      scope: {
        model: '=',
        setproject: '&'
      },
      templateUrl: '/components/dashboard/projectsView.html',
      link: function ($scope, $attrs) {
        $scope.setProjectTo = function (project, code) {
          $scope.setproject({ project: project, code: code });
        };
      }
    };
  })
  .directive('dashboardProject', function() {
    return {
      scope: {
        project: '=',
        setproject: '&'
      },
      templateUrl: '/components/dashboard/singleProjectView.html',
      link: function ($scope, $attrs) {
        $scope.setProjectTo = function (project, code) {
          $scope.setproject({ project: project, code: code });
        };
      }
    };
  })
  .directive('dashboardGoals', function() {
    return {
      scope: {
        activeProject: '=',
      },
      templateUrl: '/components/dashboard/goalsView.html'
    };
  })
  .directive('dashboardDonations', function() {
    return {
      scope: {
        activeProject: '=',
      },
      templateUrl: '/components/dashboard/donationsView.html'
    };
  });
