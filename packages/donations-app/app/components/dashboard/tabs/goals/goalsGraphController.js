angular.module('aliceApp')
  .controller('GoalsGraphController', ['$scope', function ($scope) {
    var vm = this;

    vm.axisOptions = ['week', 'month', 'year'];
    $scope.axis = 'week';

    // Override default graph graph properties
    vm.datasetOverride = [{
      backgroundColor: "#684fbe",
      pointBackgroundColor: "rgba(104, 79, 190, 0.7)",
      pointHoverBackgroundColor: "rgba(104, 79, 162, 0.8)",
      borderColor: "rgba(104, 79, 190, 0.5)",
      pointBorderColor: 'rgba(104, 79, 190, 0.8)',
      pointHoverBorderColor: "rgba(104, 79, 190, 0.8)",
      fill: false
    }];

    vm.lineChartOptions = {
      responsive: true,
      tooltips: {
        enabled: true,
        mode: 'single',
        callbacks: {
          label: function (tooltipItems, data) {
            let plural = tooltipItems.yLabel > 1 ? ' goals' : ' goal';
            return tooltipItems.yLabel + plural + ' achieved';
          }
        }
      },
      scales: {
        responsive: false,
        yAxes: [
          {
            id: 'y-axis-1',
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
                  min: 0
              }
          }
        ],
        xAxes: [{
          type: 'time',
          distribution: 'linear',
          time: {
            displayFormats: {
              'week': 'ddd D',
              'month': 'MMM D',
              'year': 'MMM-YYYY',
            },
            minUnit: 'week',
            isoWeekday: true,
          },
          ticks: {
            source: 'labels',
            fontFamily: "Avenir",
            fontColor: "#707070",
          }
        }],
        bounds: 'ticks',
      },
      elements: {
        line: {
          fill: false,
          tension: 1,
          cubicInterpolationMode: 'monotone',
          borderWidth: 1.5,
          borderColor: "rgba(25, 152, 162, 0.4)",
        },
      }
    };

    $scope.$watch('axis', function() {
      vm.lineChartOptions.scales.xAxes[0].time.unit = $scope.axis;
    });

    $scope.$watch('outcomes', function(goalsData) {
      if(goalsData) {
        prepareGoalsCompletedGraph(goalsData);
      }
    })

    $scope.setXAxis = function(option) {
        $scope.axis = option;
        getLabelsForAxis(option);
    };

    /*jshint -W030 */
    function prepareGoalsCompletedGraph(goals) {
      vm.goalGraphData = [];
      var acc = 0;
      goals.forEach((elem) => {
        if(elem.percentage === 100 && elem.date) {
          acc++;
          vm.goalGraphData.push({ x: elem.date, y: acc });
        }
      });
      vm.latest = _.first(vm.goalGraphData).x;
      getLabelsForAxis('week');
      vm.lineChartOptions.scales.yAxes[0].ticks.max = acc + 5;
      vm.total = acc;
    }

    function getLabelsForAxis(option) {
      switch (option) {
        case 'week':
          getDaysInWeek(vm.latest);
          break;
        case 'month':
          getDaysInMonth(vm.latest);
          break;
        case 'year':
          getMonthsInYear(vm.latest);
          break;
        default:
          getDaysInWeek(vm.latest);
      }
    }

    function getDaysInWeek(latestDate) {
      var dates = [];
      var startDate = new Date(moment(latestDate).subtract(3, 'days'));
      var endDate = new Date(moment(latestDate).add(3, 'days'));
      while(startDate < endDate){
        dates.push(moment(startDate));
        startDate = new Date(startDate.setDate(startDate.getDate() + 1));
      }
      vm.dates = dates;
    }

    function getDaysInMonth(latestDate) {
      var dates = []; //Array where rest of the dates will be stored
      //15 days back date from today(This is the from date)
      var startDate = new Date(moment(latestDate).subtract(15, 'days'));
      //Date after 15 days from today (This is the end date)
      var endDate = new Date(moment(latestDate).add(15, 'days'));
      //Logic for getting rest of the dates between two dates("startDate" to "endDate")
      while(startDate < endDate){
        dates.push(moment(startDate));
        startDate = new Date(startDate.setDate(startDate.getDate() + 1));
      }
      vm.dates = dates;
    }

    function getMonthsInYear(latestDate) {
      var dates = [];
      let startDate = new Date(moment(latestDate).subtract(6, 'months'));
      let endDate = new Date(moment(latestDate).add(6, 'months'));
      while(startDate < endDate){
        dates.push(moment(startDate));
        startDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
      }
      vm.dates = dates;
    }

    return vm;
  }]);
