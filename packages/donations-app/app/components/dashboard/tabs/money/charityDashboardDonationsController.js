angular.module('aliceApp')
  .controller('CharityDashboardDonationsController', ['AuthService', '$http', 'API', 'Excel', '$timeout', '$stateParams', '$scope', '$filter', '$uibModal', function (AuthService, $http, API, Excel, $timeout, $stateParams, $scope, $filter, $uibModal) {
    var vm = this;

    vm.auth = AuthService;
    vm.code = $stateParams.project;
    vm.allowPageLoad = false;

    /*jshint -W030 */
    loadDonationsForProject(vm.code);

    // SECTION 1:
    // Main backend call for data population
    function loadDonationsForProject(code) {
      $http.get(API + `getDonationsForProject/${code}`).then(function (result) {
        vm.allowPageLoad = true;
        vm.projectWithDonations = result.data;

        vm.latest = findLatestActivity(vm.projectWithDonations[0].donations,
          vm.projectWithDonations[0].validations);
        // if(vm.latest) {
        //   $scope.setXAxis('week');
        // }

        if(vm.projectWithDonations) {
          vm.upfrontPayment = vm.projectWithDonations[0].upfrontPayment;
          // Turn data to { x, y }
          cleanDataForLineChart(vm.projectWithDonations[0].donations, 0);
          cleanDataForLineChart(vm.projectWithDonations[0].validations, 0);

          vm.projectWithDonations[0].validations.unshift({ x: vm.projectWithDonations[0].donations[0].x, y: 0 });
          vm.donationsGraphData = [vm.projectWithDonations[0].donations, vm.projectWithDonations[0].validations];
          if(vm.upfrontPayment > 0) {
            let factor = vm.upfrontPayment / 100;
            vm.donationsGraphData[0].forEach((donation) => {
              vm.donationsGraphData[1].push({ x: donation.x, y: (donation.y * factor) });
            });
          }

          vm.donationsGraphDataFull = vm.donationsGraphData;

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
            user.receivedUpfront = user.donated * (vm.upfrontPayment / 100);
            user.totalReceived = user.received.reduce((acc, elem) => {
              acc = acc + elem.amount;
              return acc;
            }, 0);
          });
          vm.users = calculateReceivedForUsers(vm.users);
          vm.totalItems = vm.users.length;

          updateGraphDateRange('year');
        }
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

    // Hacky function to calculate received value for each donation
    // (here we use word "users" to be consistent with the rest of the code)
    // users here mean donations - it could be misleading and we should refactor it later
    function calculateReceivedForUsers(users) {
      let result = [];
      let visited = {};
      let usersReceived = {};

      users.sort((elem1, elem2) =>
        new Date(elem1.date).getTime() - new Date(elem2.date).getTime());

      for (let user of users) {
        const userKey = user._id;
        if (!visited[userKey]) {
          visited[userKey] = true;
          usersReceived[userKey] = user.totalReceived;
        }
        user.receviedForDonation = Math.min(usersReceived[userKey], user.donated);
        usersReceived[userKey] -= user.receviedForDonation;
        result.push(user);
        let totalReceived = user.totalReceived + user.receivedUpfront;
        user.totalReceived = Math.min(totalReceived, user.donated);
      }

      return result;
    }



    // SECTION 2:
    // Logic for donations table
    // Sorting & filtering with uib-pagination
    vm.ascending = true;
    // Hacky custom sort function for multiple page-sorting
    // uib-pagination component doesn't make this easy.
    vm.sort = function (field) {
      vm.sortField = field;
      vm.ascending = !vm.ascending;
      vm.users.sort(function(a, b) {
        if(field[0] === '-') {
          field = field.substr(1);
        }
        var nameA, nameB, temp;

        // Weird edge case for columns
        // handling money
        if(typeof a[field] !== 'number') {
          nameA = a[field].toString().toLowerCase();
          nameB = b[field].toString().toLowerCase();
        }
        else {
          nameA = a[field];
          nameB = b[field];
        }
        if(vm.ascending){
          temp = nameA; nameA = nameB; nameB = temp;
        }
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
    };

    // Donation table pagination config
    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;
    $scope.maxSize = 10;

    vm.giftAidFilter = function (row) {
      if(vm.filterGiftAid) {
        return row.giftAidAddress;
      }
      return 1;
    };

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

    vm.exportToExcel = function() {
      Excel.tableToExcel('donations-export', 'donations', 'donations.xlsx');
    };



    // SECTION 3 :
    // Donations graph functions
    vm.axisOptions = ['week', 'month', 'year'];
    $scope.axis = 'week';

    // Graph config properties
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

    // Graph rendering
    $scope.$watch('axis', function() {
      vm.lineChartOptions.scales.xAxes[0].time.unit = $scope.axis;
    });

    $scope.$watch('dates', function() {
      if($scope.dates) {
        vm.lineChartOptions.scales.xAxes[0].time.min = $scope.dates[0];
        vm.lineChartOptions.scales.xAxes[0].time.max = $scope.dates[($scope.dates.length - 1)];
      }
    })

    function updateGraphDateRange(option) {
      $scope.axis = option;
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

    $scope.updateGraphDateRange = updateGraphDateRange;

    function findLatestActivity(donations, validations) {
      let latestDonation = donations.length > 0 ? Date.parse(_.last(donations).createdAt) : 0;
      let latestValidation = validations.length > 0 ? Date.parse(_.last(validations).createdAt) : 0;
      if (latestDonation > latestValidation) {
        return latestDonation;
      }
      return latestValidation;
    }

    function getDaysInWeek(latestDate) {
      var dates = [];
      var startDate = new Date(moment(latestDate).subtract(3, 'days'));
      var endDate = new Date(moment(latestDate).add(4, 'days'));
      updateGraphData(startDate, endDate);
      while(startDate < endDate){
        dates.push(moment(startDate));
        startDate = new Date(startDate.setDate(startDate.getDate() + 1));
      }
      $scope.dates = dates;
    }

    function getDaysInMonth(latestDate) {
      var dates = []; //Array where rest of the dates will be stored
      //15 days back date from today(This is the from date)
      var startDate = new Date(moment(latestDate).subtract(15, 'days'));
      //Date after 15 days from today (This is the end date)
      var endDate = new Date(moment(latestDate).add(15, 'days'));
      updateGraphData(startDate, endDate);
      //Logic for getting rest of the dates between two dates("startDate" to "endDate")
      while(startDate < endDate){
        dates.push(moment(startDate));
        startDate = new Date(startDate.setDate(startDate.getDate() + 1));
      }
      $scope.dates = dates;
    }

    function getMonthsInYear(latestDate) {
      var dates = [];
      let startDate = new Date(moment(latestDate).subtract(12, 'months'));
      let endDate = new Date(moment(latestDate).add(0, 'months'));
      updateGraphData(startDate, endDate);
      while(startDate < endDate){
        dates.push(moment(startDate));
        startDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
      }
      $scope.dates = dates;
    }

    function updateGraphData(startDate, endDate) {
      if (!$scope.donCtrl.donationsGraphDataFull) {
        return;
      }

      let startTime = startDate.getTime();
      let endTime = endDate.getTime();

      let newGraphData = [];
      for (let line of $scope.donCtrl.donationsGraphDataFull) {
        let newLine = [];
        for (let point of line) {
          let pointTime = new Date(point.x).getTime();
          if (pointTime >= startTime && pointTime <= endTime) {
            // Hack to begin at 0
            if (newLine.length == 0) {
              newLine.push({
                x: moment(startDate),
                y: 0,
              });
            }
            newLine.push(point);
          }
        }
        newGraphData.push(newLine);
      }
      $scope.donCtrl.donationsGraphData = newGraphData;
    }

    return vm;
  }])
  .filter('offset', function() {
    return function(input, start) {
      if(input) {
        return input.slice(start);
      }
    };
  });
