angular.module('aliceApp')
  .controller('ProjectControllerV2', ['$stateParams', 'ProjectService',  '$state', function($stateParams, ProjectService, $state) {
    var vm = this;

		ProjectService.getProjectDetails($stateParams.projectCode).then(function (result) {
			vm.model = ProjectService.prepareProjectDetails(result.data);
			vm.supporters = result.data.supporters;

			console.log(vm.model);

			vm.model._outcomes.forEach((elem) => {
				let impact = vm.model.goalsV2.find((e) => {
					if(e._id === elem._id){
						return e
					}
				});
				if(impact) {
					elem.totalPercentage = Math.floor(100 * impact.totalValidatedForOutcome / elem.amount);
				} else { elem.totalPercentage = 0; }
				elem.lightColor = convertHex(elem.color, 0.4);
			});

			vm.model.percentageCompleted = Math.floor((100 * vm.model.amountValidated) / vm.model.fundingTarget);


			console.log(vm.model);
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
		templateUrl: '/components/project/components/singleGoalComponent.html'
	};
});
