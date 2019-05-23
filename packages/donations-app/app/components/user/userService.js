angular.module('aliceApp')
  .service('UserService', ['$http', '$uibModal', 'Upload', 'API', function ($http, $uibModal, Upload, API) {

    this.updateUser = function (user, photo) {
      return Upload.upload({
        url: API + 'updateUser/' + user._id,
        data: {file: photo, user: user}
      });
    };

    this.loadUserDetails = function (id) {
      return $http.get(API + "user/" + id);
    };

    this.getBalance = function () {
      return $http.get(API + "balance");
    };

    this.requestCredits = function (req) {
      return $http.post(API + "requestCredits", req);
    };

    this.inviteUser = function (invitation) {
      return $http.post(API + "inviteUser", invitation);
    };

    this.getTimelineEvents = function () {
      return $http.get(API + "timeline");
    };

  }]);