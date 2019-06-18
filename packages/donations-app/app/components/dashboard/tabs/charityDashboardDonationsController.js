angular.module('aliceApp')
  .controller('CharityDashboardDonationsController', ['AuthService', '$http', 'API', 'Excel', '$timeout', '$stateParams', '$scope', '$filter', function (AuthService, $http, API, Excel, $timeout, $stateParams, $scope, $filter) {
    var vm = this;
    vm.auth = AuthService;
    vm.code = $stateParams.project;
    vm.allowPageLoad = false;

    vm.sort = function (field) {
      vm.sortField = field;
    };

    // Override default graph graph properties
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
          vm.donationsGraphData = [vm.projectWithDonations[0].donations, vm.projectWithDonations[0].validations];
          // Turn validation/donation amounts to £ prices
          vm.totalValidated = vm.projectWithDonations[0].validations.reduce((acc, e) => {
            return acc + e.y;
          }, 0) * 100;
          vm.totalDonated = vm.projectWithDonations[0].donations.reduce((acc, e) => {
            return acc + e.y;
          }, 0) * 100;
          // Concat user arrays into one: vm.users.
          vm.users = vm.projectWithDonations[0].users.reduce((acc, elem) => {
            acc = acc.concat(elem);
            return acc;
          }, []);
          vm.totalItems = vm.users.length;
        }
      });
    }


    // relabel object keys to: { x, y }
    function cleanDataForLineChart(array, datesIndex) {
      array.forEach(elem => {
        elem.x = elem.createdAt;
        vm.dates.push(elem.x);
        elem.y = elem.amount / 100;
        delete elem.amount;
        delete elem.createdAt;
        return elem;
      });
    }

    // Donation table pagination config
    $scope.viewby = 5;
    $scope.currentPage = 1;
    $scope.itemsPerPage = $scope.viewby;
    $scope.maxSize = 5;

    return vm;
  }]);
