angular.module('aliceApp')
  .controller('MyImpactController', ['$http', 'AuthService', '$stateParams', '$scope', 'API', '$rootScope', function ($http, AuthService, $stateParams, $scope, API, $rootScope) {
    var vm = this;
    vm.auth = AuthService;
		vm.loggedUser = vm.auth.getLoggedUser();
		vm.dashboardType = 'my-impact';
		vm.code = $stateParams.project;

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
    } else {
      getProjects();
    }

    $rootScope.$on('user:login', function (event, data) {
      getProjects();
    });

    function getProjects() {
      if (vm.loaded) return;
      vm.loaded = true;
      $http.get(API + 'getMyProjects').then(function (result) {
        vm.projectsForMain = result.data;

        if(vm.projectsForMain) {
					// Get single
					vm.project = vm.projectsForMain.find(function (elem) {
						if(elem.code === vm.code) {
							return elem;
						}
					});
					if (vm.project) {
            vm.project.overallProjectPercentage = Math.round(100 * vm.project.totalPaidOutOverall / vm.project.fundingTarget);
            vm.project.individualProjectPercentage = Math.round(100 * vm.project.totalPaidOut / vm.project.fundingTarget);
            if (vm.project) {
              vm.charity = vm.project.charity;
            }

            vm.project.allImpactsForProject.forEach((elem) => {
              let impact = vm.project.impacts.find((e) => {
                if (e._id === elem._id) {
                  return e
                }
              });
              elem.userSpent = impact.total;
              elem.userPercentage = Math.floor(100 * impact.total / elem.target);
              elem.totalPercentage = Math.floor(100 * elem.totalSpent / elem.target);
              elem.lightColor = convertHex(elem.color, 0.4);
              // For stacked progress
              elem.stacked = [
                {value: (elem.totalPercentage - elem.userPercentage), color: elem.color},
                {value: elem.userPercentage, color: "#1998a2"}
              ];
            });
            vm.goals = vm.project.allImpactsForProject
          }
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
	.directive('myImpactGoal', function() {
		return {
			scope: {
				goal: '=',
				index: '='
			},
			templateUrl: '/components/my-impact/singleGoalComponent.html'
		};
	});
