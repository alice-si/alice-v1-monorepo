angular.module('aliceApp')
  .controller('MyImpactController', ['$http', 'AuthService', '$scope', 'API', '$rootScope', function ($http, AuthService, $scope, API, $rootScope) {
    var vm = this;
    vm.auth = AuthService;

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
    } else {
      getProjects();
    }

    $rootScope.$on('user:login', function (event, data) {
      getProjects();
    });

    vm.navHeight = $('#navbar-menu').height();

    function getProjects() {
      if (vm.loaded) return;
      vm.loaded = true;
      $http.get(API + 'getMyProjects').then(function (result) {
        vm.projects = result.data;
        const reducer = function (accumulator, project) {
          accumulator.totalDonated += project.totalDonated;
          accumulator.totalPaidOut += project.totalPaidOut;
          accumulator.goalsAchieved += project.goalsAchieved;
          return accumulator;
        };
        vm.activeProject = (vm.projects === undefined || vm.projects.length == 0) ? null : vm.projects[0];
        vm.summary = vm.projects.reduce(reducer, {totalDonated: 0, totalPaidOut: 0, goalsAchieved: 0});
        vm.summary.remaining = vm.summary.totalDonated - vm.summary.totalPaidOut;
				// Keeping percentage commented makes the filtering easier
				// We don't use the percentage for the impact cards for now
        // var percentage = vm.summary.totalDonated === 0 ? 0 : vm.summary.totalPaidOut / vm.summary.totalDonated * 100;
				// vm.summary.percentage = Math.round(percentage);
      });
    }

    vm.selectProject = function(code) {
      if(code) {
        vm.activeProject = _.findWhere(vm.projects, { code: code });
      }
    };
    return vm;
  }])
  .directive('myImpactCard', function() {
    return {
      scope: {
        project: '=',
        summary: '='
      },
      templateUrl: '/components/my-impact/myImpactCard.html',
			controller: ['$scope', function ($scope) {
				/*jshint -W030 */
				$scope.currentGoal;
				$scope.labels = [];
				$scope.data = [];
				$scope.colors = [];
				function prepareDataForDonut(project) {
					if(project && project.impacts) {
						project.impacts.forEach((elem) => {
							$scope.labels.push(elem.title);
							$scope.data.push(elem.total);
							$scope.colors.push(elem.color);
						});
					}
					else {
						// Dummy data & labels
						// These are only used when no impact has been made yet
						$scope.labels = ['Example Goal One', 'Example Goal Two', 'Example Goal Three', 'Example Goal Four'];
						$scope.data = [200, 400, 150, 600];
						$scope.colors = ['#9355DE', '#1CB8C4', '#097A82', '#FFCA54'];
					}
				}

				prepareDataForDonut($scope.project);
				$scope.apply;
    		// Chart-js object
				$scope.doughnut = {
					labels: $scope.labels,
					// Data & colours should be passed in
					data: $scope.data,
					colours: $scope.colors,
					options: {
						responsive: true,
						maintainAspectRatio: true,
						onHover: function(evt, item) {
							// Hover animations for the doughnuts
							$("#doughnut").css("cursor", item[0] ? "pointer" : "default");
							if (item[0]) {
									$scope.$apply(function () {
										$scope.currentGoal = item[0]._index;
									});
									item[0]._chart.config.data.datasets[0].backgroundColor[item[0]._index];
									$(".project-card-default").animate({opacity: 0}, 200);
									$(".project-card-active").animate({opacity: 1}, 400).delay(200);
									$(".doughnut-title").css("color");
							}
							else {
								$scope.$apply(function () {
									$scope.currentGoal = undefined;
								});
								$(".project-card-active").animate({opacity: 0}, 200);
								$(".project-card-default").animate({opacity: 1}, 400).delay(200);
							}
						},
						tooltips: {
							enabled: false
						}
					}
				};
			}]
    };
  });
