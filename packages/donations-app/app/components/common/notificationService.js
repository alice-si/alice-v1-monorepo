angular.module('aliceApp')
  .service('NotificationService', ['$rootScope', 'toastr', function ($rootScope, toastr) {

    $rootScope.$on("server:error", function (event, data) {
      var errorMessage = data.data;
      if (errorMessage) {
        console.log(errorMessage);
        var splitIndex = errorMessage.indexOf("<br>");
        if (splitIndex > 0) errorMessage = errorMessage.substr(0, splitIndex);
        toastr.error(errorMessage);
      }
    });

    this.success = function (message) {
      toastr.success(message);
    };

    this.error = function (message) {
      toastr.error(message);
    };

  }]);