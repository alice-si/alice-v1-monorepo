angular.module('aliceApp')
  .directive('protectedView', () => {
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: '/components/auth/protectedView.html',
      scope: {
        // Exactly one of the parameters below should be specified.
        'validator': '=',
        'validatorForProject': '=',
      },
      controller: [
        '$scope', 'AuthService',
        function ProtectedViewController($scope, AuthService) {
          let vm = this;

          vm.stillLoading = true;
          vm.loggedIn = false;
          vm.authorized = false;
          updateAuthorization();

          $scope.$on('user:login', updateAuthorization);
          $scope.$on('user:logout', updateAuthorization);
          $scope.$watch('validatorForProject', updateAuthorization);

          function updateAuthorization() {
            if (AuthService.stillLoading()) {
              return;
            }

            vm.loggedIn = AuthService.isAuthenticated();
            vm.authorized = false;
            if ($scope.validator) {
              vm.authorized = AuthService.isValidator();
              vm.stillLoading = false;
            } else if ($scope.validatorForProject) {
              vm.authorized = AuthService.hasValidatorAccess(
                $scope.validatorForProject.code);
              vm.stillLoading = false;
            } else {
              // Assume that if all parameters are undefined,
              // then one of them is still being loaded asynchronously.
              vm.stillLoading = true;
            }
          }

          return vm;
        }
      ],
      controllerAs: 'protectedViewCtrl',
    };
  });
