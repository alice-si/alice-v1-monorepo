angular.module('aliceApp')
.directive(
  'goalCard',
  function () {
    return {
      scope: {
        outcome: '=',
      },
      restrict: 'A',
      templateUrl: '/components/global/outcomeCard.html'
    };
  }
).directive(
  'goalCards',
  ['$http', 'API', function ($http, API) {
    // TODO implement
    return {
      restrict: 'A',
      link: function (scope, elm, attrs, ctrls) {
        // Load with http
      },
      template: '<h2>TODO</h2>'
    };
  }]);
