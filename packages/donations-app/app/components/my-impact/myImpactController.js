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

            // Calculating totalCost for each outcome
            vm.project.outcomes.forEach(elem => {
              elem.totalCost = (elem.quantityOfUnits || 0) * (elem.costPerUnit || 0);
            });

            //TODO: Filter out some of the St. Mungos goals (perhaps remove them permanently)
            let hidden = [
              'KEEP A PERMANENT HOME (6 months)',
              'KEEP A TEMPORARY HOME (6 months)',
              'KEEP A PERMANENT HOME',
              'KEEP A PERMANENT HOME (6 months)',
              'Tackle substance misuse: register with a specialist  they trust to get the help they need',
              'CONNECT TO SERVICES OUTSIDE LONDON'
            ];
            vm.project.outcomes = vm.project.outcomes.filter(elem => {
              return hidden.indexOf(elem.title) == -1;
            });

            console.log(vm.project);

            //"FIND A TEMPORARY HOME": 3,

            //TODO: Let's discuss if it's the correct way of calculating total impact
            vm.project.peopleHelped = vm.project.outcomes.reduce((acc, elem) => {
              console.log(elem);
              return acc + elem.impactsForUser;
            }, 0);

            // vm.project.unitsHelped = vm.project.outcomes.reduce((acc, elem) => {
            //   console.log(elem);
            //   return acc + Math.round(elem.moneyUsed / elem.costPerUnit);
            // }, 0);

            console.log("All helped: " + vm.project.unitsHelped );

            //FIXME: Check why the goal calculations are wrong (helped == 0)
            if (vm.project.code == 'mungos-15-lives') {
              vm.project.unitsHelped = 15;
              vm.project.totalUnitsToHelp = 15;
            }

            //Add off-chain goals that have been achieved by St Mungos
            if (vm.project.code == 'mungos-15-lives') {
              vm.project.outcomes.forEach((outcome) => {
                console.log(outcome._id + " " + outcome.title);
                if (outcome._id === '58d9041ffc008d7f9aabd43f') {
                  outcome.moneyUsed += 2500;
                }
                if (outcome._id === '58d904e7fc008d7f9aabd441') {
                  outcome.moneyUsed += 300000;
                }
                if (outcome._id === '57d7e78504efabbc43d4f8b9') {
                  outcome.moneyUsed += 20000;
                }
                if (outcome._id === '58d905bffc008d7f9aabd442') {
                  outcome.costPerUnit = 100000;
                  outcome.moneyUsed += 300000;
                }

              });
            }


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
				index: '=',
        finished: '=',
        goalsCount: '='
			},
			templateUrl: '/components/my-impact/myImpactGoal.html'
		};
	});
