angular.module('aliceApp')
  .controller(
    'goalCarouselController',
    ['$scope', function ($scope) {
        let vm = this;

        console.log($scope.outcomes);

        $scope.$watch('outcomes', function(outcomesData) {
            if (outcomesData) {
                vm.goals = _.chunk(outcomesData, 3);
            }
        });

        return vm;
    }]);
