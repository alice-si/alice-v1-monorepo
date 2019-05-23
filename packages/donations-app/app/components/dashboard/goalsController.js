angular.module('aliceApp')
  .controller('DashboardGoalsController', ['AuthService', '$scope', '$http', 'API', '$stateParams', function (AuthService, $scope, $http, API, $stateParams) {
    var vm = this;
    vm.auth = AuthService;
    vm.mode = $stateParams.tab;

    const MAX_DATE_MARGIN = {number: 1, unit: 'months'};
    const MIN_DATE_MARGIN = {number: -1, unit: 'months'};

    /*jshint -W030 */
    $scope.activeProject;
    $scope.$watch('activeProject', function() {
      loadGoalsData($scope.activeProject);
    });

    function loadGoalsData(activeProject) {
      $http.get(API + 'getGoalsForProjects').then(function (result) {
        vm.projectsWithGoals = result.data;

        vm.projectsWithGoals = vm.projectsWithGoals.map(project => {
          var moments = getMinAndMaxMoments(project);
          var maxCount = 0;

          var chartData = project.outcomes.reduce((acc, outcome) => {
              var line = {color: outcome.color, points: {fillColor: outcome.color}};
              var count = 0;
              line.data = outcome.validations.reduce((acc, validation) => {
                  if (count === 0
                  ) {
                    acc.push([moment(validation.time), count++]);
                  }
                  acc.push([moment(validation.time), count++]);
                  return acc;
                },
                []
              );
              maxCount = Math.max(maxCount, count);
              acc.push(line);

              return acc;
            },
            []
          );

          project.chartData = chartData;
          project.chartOptions = prepareGoalsChartOptions(moments.min, moments.max, maxCount);
          return project;
        });
        if(activeProject) {
          vm.projectsWithGoals = vm.projectsWithGoals.filter(project => project.title == activeProject.title);
        }
      });
    }

    function prepareGoalsChartOptions(minMoment, maxMoment, maxCount) {
      return {
        grid: {
          borderWidth: {top: 0, right: 0, bottom: 1, left: 1},
          borderColor: {left: "#1998a2", bottom: "#1998a2"},
          labelMargin: 10,
          color: "#B7B7B7"
        },
        xaxis: {
          mode: "time",
          minTickSize: [1, "day"],
          monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
          min: minMoment,
          max: maxMoment
        },
        yaxis:
          {
            min: 0,
            max: maxCount + 1,
            tickSize: 1
          },
        series: {
          lines: {show: true, lineWidth: 4},
          points: {show: true, radius: 5, fill: true}
        }
      };
    }

    function getMinAndMaxMoments(project) {
      var moments = project.outcomes.reduce((acc, outcome) => {
          outcome.validations.forEach(function (validation) {
            acc.push(moment(validation.time));
          });
          return acc;
        },
        []
      );

      return {
        min: moment.min(moments).add(MIN_DATE_MARGIN.number, MIN_DATE_MARGIN.unit),
        max: moment.max(moments).add(MAX_DATE_MARGIN.number, MAX_DATE_MARGIN.unit)
      };
    }

    return vm;
  }]);
