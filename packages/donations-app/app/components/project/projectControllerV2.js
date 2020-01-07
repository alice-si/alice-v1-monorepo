angular.module('aliceApp')
  .controller('ProjectControllerV2', ['$stateParams', '$state', 'ProjectService', 'CheckoutService', 'REDIRECTION', function($stateParams, $state, ProjectService, CheckoutService, REDIRECTION) {
		var vm = this;

		ProjectService.getProjectDetails($stateParams.projectCode).then(function (result) {
			vm.model = ProjectService.prepareProjectDetails(result.data);
			vm.model.projectShareLink = REDIRECTION + 'redirection/project-' + vm.model.code + '.html';
			vm.supporters = result.data.supporters;

			// TODO alex - solve it better
			// Probably we should have global directive for project white card on splash
			if (vm.model.code == 'mungos-15-lives') {
				vm.model.unitsHelped = 15;
				vm.model.totalUnitsToHelp = 15;
			}

			vm.model._outcomes.forEach((elem) => {
				let impact = vm.model.goalsV2.find((e) => {
					if(e._id === elem._id){
						return e
					}
				});
				if(impact) {
					elem.totalPercentage = Math.floor(100 * impact.totalValidatedForOutcome / elem.amount);
					elem.totalValidatedForOutcome = impact.totalValidatedForOutcome;
				} else {
					elem.totalPercentage = 0;
					elem.totalValidatedForOutcome = 0;
				}
				elem.lightColor = elem.color ? convertHex(elem.color, 0.4) : 'rgba(255, 255, 255, 0.3)';
			});

			vm.goals = _.chunk(vm.model._outcomes, 3);

			vm.model.percentageCompleted = Math.floor((100 * vm.model.amountValidated) / vm.model.fundingTarget);
		});

		function convertHex(hex, opacity) {
			hex = hex.replace('#','');
			let r = parseInt(hex.substring(0,2), 16);
			let g = parseInt(hex.substring(2,4), 16);
			let b = parseInt(hex.substring(4,6), 16);

			let result = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
			return result;
		}

		vm.donate = function() {
			CheckoutService.startCheckout(vm.model);
		}

}])
.directive('appealGoal', function() {
	return {
		scope: {
			goal: '=',
			index: '='
		},
		templateUrl: '/components/project/components/singleGoalComponent.html',
		controller: ['$scope', function ($scope) {
			$scope.hoverOn = function(goal) {
				$scope.activeGoal = goal;
			};
			$scope.hoverOff = function() {
				$scope.activeGoal = undefined;
			};
		}]
	};
})
.directive('appealStory', function() {
	return {
		scope: {
			story: '='
		},
		templateUrl: 'components/project/components/singleStoryComponent.html',
	};
})
.directive('stickyDonate', function() {
	return {
		scope: {
			project: '='
		},
		templateUrl: 'components/project/components/stickyDonate.html',
		controller: ['$scope', 'CheckoutService', function ($scope, CheckoutService) {
			$scope.donate = function() {
					CheckoutService.startCheckout($scope.project);
			}

			// Hide on Scroll.
	    $(window).scroll(function () {
	      var scrollPos = $(window).scrollTop();
        if (scrollPos < 140) {
          $('.sticky-donate').css({ top: '-120px', opacity: '0'});
        }
        else {
          $('.sticky-donate').css({ top: '0', opacity: '100'});
        }
	    });
		}]
	};
});
