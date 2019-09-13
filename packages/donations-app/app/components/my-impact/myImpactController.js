angular.module('aliceApp')
  .controller('MyImpactController', ['$http', 'AuthService', '$stateParams', '$scope', '$state', 'API', '$rootScope', 'CheckoutService', 'ETHERSCAN', function ($http, AuthService, $stateParams, $scope, $state, API, $rootScope, CheckoutService, ETHERSCAN) {
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
            vm.project.unitsHelpedWithUserDonations =
              vm.project.impacts.reduce((acc, userImpact) => {
                return acc + (userImpact.count);
              }, 0);

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

            //"FIND A TEMPORARY HOME": 3,

            if (vm.project.code == 'mungos-15-lives') {
              vm.project.totalUnitsToHelp = 15;
            }

            //Add off-chain goals that have been achieved by St Mungos
            if (vm.project.code == 'mungos-15-lives') {
              vm.project.outcomes.forEach((outcome) => {
                if (outcome._id === '58d9041ffc008d7f9aabd43f') {
                  outcome.moneyUsed += 2500;
                }
                if (outcome._id === '58d904e7fc008d7f9aabd441') {
                  outcome.moneyUsed += 300000;
                }
                // Duplicated outcome
                // if (outcome._id === '57d7e78504efabbc43d4f8b9') {
                //   outcome.moneyUsed += 20000;
                // }
                if (outcome._id === '58d905bffc008d7f9aabd442') {
                  outcome.costPerUnit = 100000;
                  outcome.moneyUsed += 300000;
                }

              });
            }

						console.log(vm.project);
          }
				}
      });
    }

    vm.scrollGoal = function(direction) {
			let position = (direction === 'left') ? '-=300': '+=300';
			angular.element('#appeal-goals').animate({ scrollLeft: position }, 400);
			event.preventDefault();
		};

    vm.boostDonation = function() {
      // $state.go('project', { projectCode: vm.project.code });
      CheckoutService.startCheckout(vm.project);
    };

    vm.getEtherscanLinkForProject = function() {
      // Hack for St' Mungos because it doesn't contain ethAddresses field
      if (vm.project && vm.project.code == 'mungos-15-lives') {
        vm.project.ethAddresses = {
          project: '0xbd897c8885b40d014fb7941b3043b21adcc9ca1c'
        };
      }
      if (vm.project) {
        return `${ETHERSCAN}/address/${vm.project.ethAddresses.project}`;
      }
    };

    return vm;
  }]);

  // TODO alex - remove the commented code
	// .directive('myImpactGoal', function() {
	// 	return {
	// 		scope: {
	// 			goal: '=',
	// 			index: '=',
  //       finished: '=',
  //       goalsCount: '='
	// 		},
	// 		templateUrl: '/components/my-impact/myImpactGoal.html'
	// 	};
	// });
