angular.module('aliceApp')
  .controller('DashboardController', ['$scope', 'AuthService', '$http', 'API', '$stateParams', function ($scope, AuthService, $http, API, $stateParams) {
    var vm = this;
    vm.auth = AuthService;
    vm.mode = 0;
    vm.projectSelected = [];
    /*jshint -W030 */
    vm.activeProject;
    vm.dashboardType = 'charity-dashboard';

    const modes = { 'OVERALL' : 0, 'SINGULAR' : 1, 'DONATIONS': 2, 'GOALS': 3 };

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
    }

    $http.get(API + 'getProjectsForMain').then(function (result) {
      vm.projectsForMain = result.data;
      vm.projectsForMain.forEach(project => {
        console.log(vm.projectsForMain);
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
    return vm;
  }])
  // TODO alex remove after tests
  // .directive('dashboardProjectCard', () => {
  //   return {
  //     scope: {
  //       dashboard: '=',
  //       project: '=',
  //     },
  //     templateUrl: '/components/global/projectCard.html',
  //   };
  // })
  .directive('dashboardDonations', function() {
    return {
      scope: {
        activeProject: '=',
      },
      templateUrl: '/components/dashboard/donationsView.html'
    };
  });
