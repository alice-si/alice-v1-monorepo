angular.module('aliceApp')
  .service('SearchService', ['$http', 'AuthService', 'API', function ($http, AuthService, API) {

    this.findUsers = function (val) {
      return $http.get(API + 'userSearch/' + val).then(function (response) {
        return response.data.filter(function (item) {
          return item._id != AuthService.getLoggedUser()._id;
        });
      });
    };


  }]);