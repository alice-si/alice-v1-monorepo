angular.module('aliceApp')
  .controller('MyImpactController', ['$http', 'AuthService', '$stateParams', '$scope', '$state', 'API', '$rootScope', 'CheckoutService', function ($http, AuthService, $stateParams, $scope, $state, API, $rootScope, CheckoutService) {
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

            // Calculating unitsToHelp and unitHelped
            vm.project.unitsHelped = vm.project.completedValidations.length;
            vm.project.totalUnitsToHelp = vm.project.outcomes.reduce((acc, outcome) => {
              return (Number(outcome.quantityOfUnits) || 0) + acc;
            }, 0);
            vm.project.unitsHelpedWithUserDonations = vm.project.impacts.length;

            // Calculating totalCost and status for each outcome
            vm.project.outcomes.forEach(elem => {
              elem.totalCost = (elem.quantityOfUnits || 0) * (elem.costPerUnit || 0);
              if (elem.totalCost == elem.moneyUsed) {
                elem.status = 'Completed';
              } else {
                elem.status = elem.moneyUsed > 0 ? 'In progress' : 'Not started';
              }
            });
          }
				}
      });
    }

    vm.scrollGoal = function(direction) {
			let position = (direction === 'left') ? '-=300': '+=300';
			angular.element('#appeal-goals').animate({ scrollLeft: position }, 400);
			event.preventDefault();
		}

    vm.boostDonation = function() {
      // $state.go('project', { projectCode: vm.project.code });
      CheckoutService.startCheckout(vm.project);
    };

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
			templateUrl: '/components/my-impact/myImpactGoal.html'
		};
	});
