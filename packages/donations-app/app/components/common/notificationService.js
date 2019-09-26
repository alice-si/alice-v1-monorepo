angular.module('aliceApp')
  .service('NotificationService', ['$rootScope', 'toastr', function ($rootScope, toastr) {

    $rootScope.$on("server:error", function (event, data) {
      var errorMessage = data.data;
      if (errorMessage) {
        // alex@alice.si commented it as it caused a problem with error notifiaction showing
        // var splitIndex = errorMessage.indexOf("<br>");
        // if (splitIndex > 0) errorMessage = errorMessage.substr(0, splitIndex);
        if(!_.isEmpty(errorMessage)) {
          console.log(errorMessage);
          if(errorMessage !== 'Transaction amount is higher than maximum permitted amount') {
            toastr.error(errorMessage);
          }
        }
      }
    });

    this.success = function (message) {
      toastr.success(message);
    };

    this.error = function (message) {
      toastr.error(message);
    };


  }]);
