angular.module('aliceApp')
  .controller(
    'ValidationSummaryController',
    [
      '$http', '$scope', 'API', 'AuthService',
      function ($http, $scope, API, AuthService) {
        let vm = this;
        vm.auth = AuthService;
        vm.dashboardType = 'validation';

        vm.projects = [];

        loadSummary();
        $scope.$on('user:login', loadSummary);

        function loadSummary() {
          $http.get(API + 'getValidatorSummary').then(result => {
            vm.projects = result.data;
          });
        }

        return vm;
      }
    ])
  .directive('projectValidationCard', () => {
    return {
      templateUrl: '/components/global/projectCard.html',
    };
  });
