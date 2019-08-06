angular.module('aliceApp')
  .controller('CharityDashboardDonationsController', ['AuthService', '$http', 'API', 'Excel', '$timeout', '$stateParams', '$scope', '$filter', '$uibModal', function (AuthService, $http, API, Excel, $timeout, $stateParams, $scope, $filter, $uibModal) {
    var vm = this;

    vm.auth = AuthService;
    vm.code = $stateParams.project;
    vm.allowPageLoad = false;

    vm.sort = function (field) {
      vm.sortField = field;
    };

    vm.exportToExcel = function() {
      Excel.tableToExcel('donations', 'donations', 'donations.xlsx');
    };

    vm.axisOptions = ['week', 'month', 'year'];
    $scope.axis = 'week';

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
      responsive: true,
      tooltips: {
        enabled: true,
        mode: 'single',
        callbacks: {
          label: function (tooltipItems, data) {
            return "£" + tooltipItems.yLabel.toFixed(2);
          },
          backgroundColor: 'rgba(86, 107, 140, 0.65)',
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
                  callback: function(value) {
                      return '£' + value;
                  }
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

    $scope.setXAxis = function(option) {
        $scope.axis = option;
        getLabelsForAxis(option);
    };

    /*jshint -W030 */
    loadDonationsForProject(vm.code);

    function loadDonationsForProject(code) {
      $http.get(API + `getDonationsForProject/${code}`).then(function (result) {
        vm.allowPageLoad = true;
        vm.projectWithDonations = result.data;
        if(vm.projectWithDonations) {
          vm.latest = findLatestActivity(vm.projectWithDonations[0].donations,
            vm.projectWithDonations[0].validations);
          if(vm.latest) {
            $scope.setXAxis('week');
          }
          cleanDataForLineChart(vm.projectWithDonations[0].donations, 0);
          cleanDataForLineChart(vm.projectWithDonations[0].validations, 0);

          vm.projectWithDonations[0].validations.unshift({ x: vm.projectWithDonations[0].donations[0].x, y: 0 });
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
          vm.users.forEach((user) => {
            user.totalReceived = user.received.reduce((acc, elem) => {
              acc = acc + elem.amount;
              return acc;
            }, 0);
          });
          vm.totalItems = vm.users.length;
        }
      });
    }

    vm.openGiftAidAddress = function(user) {
      $uibModal.open({
        resolve: {
          giftAidUser: function() {
            return user;
          }
        },
        templateUrl: '/components/dashboard/giftAidModal.html',
        controller: ['$scope', 'giftAidUser', function($scope, giftAidUser) {
          $scope.user = giftAidUser;
          $scope.dismissModal = function() {
            $scope.$dismiss();
          }
        }]
      });
    }

    // relabel object keys to: { x, y }
    function cleanDataForLineChart(array, datesIndex) {
      array.forEach(elem => {
        elem.x = elem.createdAt;
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

    function findLatestActivity(donations, validations) {
      let latestDonation = donations.length > 0 ? Date.parse(_.last(donations).createdAt) : 0;
      let latestValidation = validations.length > 0 ? Date.parse(_.last(validations).createdAt) : 0;
      if (latestDonation > latestValidation) {
        return latestDonation;
      }
      else {
        return latestValidation;
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
