angular.module('aliceApp')
  .controller('RegistrationFinishingController', ['API', '$state', '$stateParams', 'AuthService', '$http', function (API, $state, $stateParams, AuthService, $http) {

    console.log(`Finishing registration for user with id: ${$stateParams.userId}`);
    AuthService.logout();
    
    $http.get(`${API}getPublicUserData/${$stateParams.userId}`).then(function (result) {
      AuthService.showSignUpModal(function () {
          $state.go("my-impact");
        }, result.data.email);
    });

  }]);