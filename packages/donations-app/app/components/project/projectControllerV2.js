angular.module('aliceApp')
  .controller('ProjectControllerV2', ['$stateParams', 'ProjectService',  '$scope', '$state', function($stateParams, ProjectService, $scope, $state) {
    var vm = this;

		ProjectService.getProjectDetails($stateParams.projectCode).then(function (result) {
			vm.model = ProjectService.prepareProjectDetails(result.data);
			vm.supporters = result.data.supporters;

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

			vm.model.percentageCompleted = Math.floor((100 * vm.model.amountValidated) / vm.model.fundingTarget);

			// Split myStory array into 2 arrays: 1. of length 3, 2. of length: myStory.length - 3;
			vm.model._outcomesExpanded = vm.model._outcomes.filter((e, index) => index > 2 );
			vm.model._outcomesFirst3 = vm.model._outcomes.filter((e, index) => index < 3 );
		});

		function convertHex(hex, opacity) {
			hex = hex.replace('#','');
			let r = parseInt(hex.substring(0,2), 16);
			let g = parseInt(hex.substring(2,4), 16);
			let b = parseInt(hex.substring(4,6), 16);

			let result = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
			return result;
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
});
