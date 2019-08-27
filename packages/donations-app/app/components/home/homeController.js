angular.module('aliceApp')
  .controller('HomeController', ['ProjectService', 'NotificationService', 'API', '$location', '$http', '$uibModal', function (ProjectService, NotificationService, API, $location, $http, $uibModal) {
    var vm = this, navHeight = $('#navbar-menu').height();

    var loadData = function () {
      vm.contact = {};
      loadProjectsWithCharities();
    };

    $uibModal.open({
      templateUrl: '/components/vodafone/homePageModal.html',
      backdrop: 'static',
      resolve: {}
    });

    var loadProjectsWithCharities = function () {
      ProjectService.getActiveProjects().then(function (projects) {
        vm.projects = _.map(projects.data, (project) => {
          let keyList = ['title', 'code', 'charity', 'lead', 'img'];

          return _.pick(project, keyList);
        });
        loadCharities();
      });
    }

    var loadCharities = function () {
      $http.get(API + 'getCharities').then(function (response) {
        vm.charities = response.data;
        _.each(vm.projects, (project) => {
          let charityInfo = _.where(vm.charities, { _id: project.charity })[0];
          let keyList = ['name', 'url'];
          charityInfo = _.pick(charityInfo, keyList);
          project.charity = charityInfo;
        });
      }
    );
    }

    loadData();

    vm.sendMessage = function () {
      vm.contactForm.$submitted = true;
      if (vm.contactForm.$valid) {
        vm.sending = true;
        $http.post(API + 'contact', vm.contact).then(
          function (response) {
            NotificationService.success('Message has been sent.');
            vm.contact = {};
            vm.contactForm.$submitted = false;
            vm.contactForm.$setUntouched();
            vm.contactForm.$setPristine();
            vm.sending = false;
          }, function (rejection) {
            NotificationService.error('Unfortunately we couldn\'t sent your message.');
            vm.sending = false;
          }
        );
      }
    };

    vm.explore = function(event) {
      document.getElementById("home-projects").scrollIntoView();
    }

    return vm;

  }])
  .directive('homepageProjectCard', () => {
    return {
      scope: {
        dashboard: '=',
        project: '=',
      },
      // Duplicate of global/projectCard
      // Has a different structure from global dashboard projectCard
      templateUrl: '/components/home/projectCard.html',
    };
  });
