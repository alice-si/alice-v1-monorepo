angular.module('aliceApp')
  .controller('DashboardDonationsController', ['AuthService', '$http', 'API', 'Excel', '$timeout', '$stateParams', '$scope', '$filter', function (AuthService, $http, API, Excel, $timeout, $stateParams, $scope, $filter) {
    var vm = this;
    vm.auth = AuthService;
    vm.code = $stateParams.project;

    // For temporary Chart.js Donations Graph
    // Recreating the donations model based on discussions.
    $scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
    $scope.series = ['Series A'];
    $scope.data = [
      [65, 59, 80, 81, 56, 55, 40]
    ];
    $scope.onClick = function (points, evt) {
      console.log(points, evt);
    };
    $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }];
    $scope.options = {
      scales: {
        responsive: false,
        yAxes: [
          {
            id: 'y-axis-1',
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
                suggestedMin: 0,    // minimum will be 0, unless there is a lower value.
                suggestedMax: 100,
            }
          }
        ],
        xAxes: [{
          ticks: {
            fontFamily: "Avenir",
            fontColor: "#707070",
          }
        }],
      },
      elements: {
        line: {
          fill: false,
          tension: 0.1,
          cubicInterpolationMode: 'monotone',
        }
      }
    };
    $scope.colors = ['#1998a2'];
    // Ends here.


    const MAX_DATE_MARGIN = {number: 1, unit: 'months'};
    const MIN_DATE_MARGIN = {number: -1, unit: 'months'};


    vm.exportToExcel = function () {
      Excel.tableToExcel('donations', 'donations', 'donations.xlsx');
    };

    vm.sort = function (field) {
      vm.sortField = field;
    };

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
    }

    /*jshint -W030 */
    loadDonationsForProject(vm.code);

    function loadDonationsForProject(code) {
      $http.get(API + `getDonationsForProject/${code}`).then(function (result) {
        vm.projectWithDonations = result.data;
        console.log(result.data);
        if(vm.projectWithDonations) {
          vm.projectWithDonations.dates = [];
          vm.projectWithDonations.createdAt.map(elem => {
            vm.projectWithDonations.dates.push(moment(elem.createdAt).format("MM/DD/YYYY"));
          });
          console.log(vm.donations);
        }

      });
    }


    // Multiple projects
    function loadDonationsForProjects() {
      $http.get(API + 'getDonationsForProjects').then(function (result) {
        vm.projectsWithDonations = result.data;
        console.log(vm.projectsWithDonations);
        vm.projectsWithDonations = vm.projectsWithDonations.map(project => {
          project.selected = true;
          return project;
        });
      });
    }

    function reloadDonationsData() {
      if (!vm.projectsWithDonations) {
        return;
      }
      var selectedData = vm.projectsWithDonations.reduce((acc, project) =>
        {
          if (project.selected) {
            acc.donations = acc.donations.concat(project.donations);
            acc.validations = acc.validations.concat(project.validations);
            acc.donationsUsers = acc.donationsUsers.concat(project.users);
          }
          return acc;
        },
        {
          donations: [],
          validations: [],
          donationsUsers: []
        }
      );

      var selectedDontaionsData = prepareDataForAccumulativeSortedChart(selectedData.donations);
      var selectedValidationsData = prepareDataForAccumulativeSortedChart(selectedData.validations);
      var selectedDonationsUsersData = groupUsers(selectedData.donationsUsers);

      vm.donationsChartOptions = prepareDonationsChartOptions(selectedDontaionsData);
      vm.donationsChartData = [
        {color: '#1998a2', points: {fillColor: "#1998a2"}},
        {color: '#B7B7B7', points: {fillColor: "#B7B7B7"}}
      ];
      vm.donationsChartData[0].data = selectedDontaionsData;
      vm.donationsChartData[1].data = selectedValidationsData;
      vm.donations = selectedDonationsUsersData;

      var summary = countSummaryForSelectedProjects(selectedData);
      vm = Object.assign(vm, summary);
    }

    function countSummaryForSelectedProjects(selectedData) {
      function sum(arr, key) {
        return arr.reduce((acc, cur) => acc + cur[key], 0
        );
      }

      var donationsTotal = sum(selectedData.donations, 'amount');
      var totalReceived = calculateTotalReceived();
      var donationsLength = selectedData.donations.length;

      return {
        donated: donationsTotal,
        received: totalReceived,
        avgDonation: donationsLength === 0 ? 0 : donationsTotal / donationsLength
      };
    }

    function calculateTotalReceived() {
      return vm.donations.reduce((res, donation) => res + donation.paidOut, 0);
    }

    function groupUsers(users) {
      pos = 0;
      usersDict = users.reduce((acc, user) => {
          if (!acc[user._id]) {
            acc[user._id] = Object.assign({}, user);
            acc[user._id].pos = ++pos;
            acc[user._id].refunded = 0;
          }
          else {
            acc[user._id].total += user.total;
            acc[user._id].count += user.count;
            acc[user._id].paidOut += user.paidOut;
            if (acc[user._id].last < user.last) {
              acc[user._id].last = user.last;
            }
          }
          return acc;
        },
        {}
      );

      return Object.values(usersDict);
    }

    function prepareDonationsChartOptions(donations) {
      var maxVal = donations.reduce((curMax, donation) => {
          return Math.max(curMax, donation[1]);
        },
        0
      );
      return {
        grid: {
          borderWidth: {top: 0, right: 0, bottom: 1, left: 1},
          borderColor: {left: "#1998a2", bottom: "#1998a2"},
          labelMargin: 10,
          hoverable: true,
          color: "#B7B7B7"
        },
        xaxis: {
          mode: "time",
          minTickSize: [1, "day"],
          monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
          max: (moment(new Date()).add(MAX_DATE_MARGIN.number, MAX_DATE_MARGIN.unit)).valueOf()
        },
        yaxis:
          {
            min: 0,
            max: maxVal,
            tickSize: maxVal / 10
          },
        series: {
          lines: {show: true, lineWidth: 2},
          points: {show: true, radius: 2, fill: true}
        },
        tooltip: {
          show: true,
          content: function(label, xval, yval, flotItem) {
            return $filter('money')(yval* 100000);
          }
        }
      };
    }

    function removeTimeFromDate(date) {
        let changeDate = new Date(date.createdAt);
        return moment(new Date(changeDate.getFullYear(), changeDate.getMonth(), changeDate.getDate())).valueOf();
    }

    // group donations by date with accumulated values (accumulated for each day)
    function perDay(data) {
      if (data.length > 1) {
        var currentDate = data[0][0];
        accumulate = 0;
        let dataPerDay = data.reduce((acc, elem) => {
          if (elem[0] != currentDate) {
            acc.push([currentDate, accumulate]);
            currentDate = elem[0];
            accumulate = elem[1];
          } else {
            accumulate += elem[1];
          }
          return acc;
        },
        [[currentDate, accumulate]]);
        dataPerDay.push([currentDate, accumulate]);
        return dataPerDay;
      }
      else {
        return data;
      }
    }

    function prepareDataForAccumulativeSortedChart(collection) {
      // this sort is for the case when there are some projects
      collection = collection.sort((el1, el2) => {
        var moment1 = moment(el1.createdAt).valueOf();
        var moment2 = moment(el2.createdAt).valueOf();
        return moment1 - moment2;
      });
      // removeing time for each date
      // descreasing amount by 100000 to show thousands
      var data = collection.reduce((acc, elem) => {
          const newDate = removeTimeFromDate(elem);
          acc.push([newDate, elem.amount / 100000]);
          return acc;
        },
        []
      );
      return perDay(data);
    }

    return vm;
  }]);
