angular.module('aliceApp')
  .controller('CharityDashboardDonationsController', ['AuthService', '$http', 'API', 'Excel', '$timeout', '$stateParams', '$scope', '$filter', function (AuthService, $http, API, Excel, $timeout, $stateParams, $scope, $filter) {
    var vm = this;
    vm.auth = AuthService;
    vm.code = $stateParams.project;
    vm.allowPageLoad = false;

    // Recreating the donations model based on discussions.
    vm.datasetOverride = [{
      backgroundColor: "#1998A2",
      pointBackgroundColor: "rgba(25, 152, 162, 0.3)",
      pointHoverBackgroundColor: "rgba(25, 152, 162, 0.8)",
      borderColor: "rgba(25, 152, 162, 0.5)",
      pointBorderColor: 'rgba(25, 152, 162, 0.8)',
      pointHoverBorderColor: "rgba(25, 152, 162, 0.8)",
      fill: false
    }, {
      backgroundColor: "#FFCA54",
      pointBackgroundColor: "rgba(255, 202, 84, 0.3)",
      pointHoverBackgroundColor: "rgba(255, 202, 84, 0.8)",
      borderColor: "rgba(255, 202, 84, 0.5)",
      pointBorderColor: 'rgba(255, 202, 84, 0.8)',
      pointHoverBorderColor: "rgba(255, 202, 84, 0.8)",
      fill: false
    }];

    vm.lineChartOptions = {
      tooltips: {
        enabled: true,
        mode: 'single',
        callbacks: {
          label: function (tooltipItems, data) {
            return "£" + tooltipItems.yLabel.toFixed(2);
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
                suggestedMin: 0,
                // minimum will be 0, unless there is a lower value.
            }
          }
        ],
        xAxes: [{
          type: 'time',
          time: {
            unit: 'week',
            parser: 'YYYY-MM-DD',
            displayFormat: 'll',
          },
          ticks: {
            source: 'auto',
            fontFamily: "Avenir",
            fontColor: "#707070",
          }
        }],
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

    /*jshint -W030 */
    loadDonationsForProject(vm.code);

    function loadDonationsForProject(code) {
      $http.get(API + `getDonationsForProject/${code}`).then(function (result) {
        vm.allowPageLoad = true;
        vm.projectWithDonations = result.data;
        vm.dates = [];
        if(vm.projectWithDonations) {
          cleanDataForLineChart(vm.projectWithDonations[0].donations, 0);
          cleanDataForLineChart(vm.projectWithDonations[0].validations, 0);
          vm.donationsData = [vm.projectWithDonations[0].donations, vm.projectWithDonations[0].validations];
          console.log(vm.donationsData);
        }
        else {
          console.log('no donations');
        }
      });
    }

    function cleanDataForLineChart(array, datesIndex) {
      array.forEach(elem => {
        elem.x = elem.createdAt;
        vm.dates.push(elem.x);
        elem.y = elem.total / 100;
        delete elem.total;
        delete elem.createdAt;
        return elem;
      });
    }


    return vm;
  }]);
