angular.module('aliceApp')
  .controller('HomeController', ['ProjectService', 'NotificationService', 'API', '$location', '$http', function (ProjectService, NotificationService, API, $location, $http) {
    var vm = this, navHeight = $('#navbar-menu').height();

    var loadData = function () {
      vm.contact = {};
      ProjectService.getActiveProjects().then(function (projects) {
        vm.projects = _.map(projects.data, (project) => {
          let keyList = ['title', 'code', 'charity', 'lead', 'img'];
          return _.pick(project, keyList);
        });
      });

      $http.get(API + 'getCharities').then(function (response) {
          vm.charities = response.data;
          _.each(vm.projects, (project) => {
            let charity_info = _.where(vm.charities, { _id: project.charity })[0];
            let keyList = ['name', 'url'];
            charity_info = _.pick(charity_info, keyList);
            project.charity = charity_info;
          });
          console.log(vm.charities);
        }
      );
    };

    loadData();

    vm.sendMessage = function () {
      vm.contactForm.$submitted = true;
      if (vm.contactForm.$valid) {
        vm.sending = true;
        $http.post(API + 'sendMessage', vm.contact).then(
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
