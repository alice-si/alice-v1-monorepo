angular.module('aliceApp')
  .controller('ProjectControllerOld', ['$stateParams', 'ProjectService', function ($stateParams, ProjectService) {
    var vm = this;

    ProjectService.getProjectDetails($stateParams.projectCode).then(function (result) {
      vm.model = ProjectService.prepareProjectDetails(result.data);
      vm.supporters = result.data.supporters;
      vm.model.outcomeCategories = {};
      vm.model._outcomes.forEach(function (outcome) {
        console.log(outcome.category);
        if (vm.model.outcomeCategories[outcome.category] === undefined) {
          vm.model.outcomeCategories[outcome.category] = [];
        }
        vm.model.outcomeCategories[outcome.category].push(outcome);
      });
      console.log(vm.model.outcomeCategories);
    });

    return vm;
  }])
  .directive('projectDetails', function () {
    return {
      scope: {
        model: '=',
        pilot: '='
      },
      templateUrl: '/components/project/projectTemplate.html'
    };
  }).directive('myStory', function () {
  return {
    scope: {
      model: '=',
      index: '='
    },
    templateUrl: '/components/project/myStoryTemplate.html'
  };
});
