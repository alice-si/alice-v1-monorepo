angular.module('aliceApp')
  .controller('HomeController', ['ProjectService', 'NotificationService', 'API', '$location', '$http', '$uibModal', 'MODE', function (ProjectService, NotificationService, API, $location, $http, $uibModal, MODE) {
    var vm = this, navHeight = $('#navbar-menu').height();

    var loadData = function () {
      vm.contact = {};
      loadProjectsWithCharities();
    };

    if (MODE != 'prod' && !localStorage.vodafoneWindowOpenedHome) {
      localStorage.vodafoneWindowOpenedHome = true;
      $uibModal.open({
        templateUrl: '/components/vodafone/homePageModal.html',
        backdrop: 'static',
        resolve: {}
      });
    }

    // FIXME
    // Livia asked to move fusion-housing project from the first position of
    // active projects
    // The problem is connected with the fact that fusion housing project was
    // the second project created on stage (after st-mungos)
    function doHackForFusionHousing(projects) {
      function getNewIndex({code}) {
        const newProjectIndexes = {
          'mungos-15-lives': 0,
          'save-from-abuse': 1,
          'gift-of-walking': 2,
          'fusion-housing-1': 3,
        }
        return newProjectIndexes[code] || 4;
      }
      projects.sort(
        (prj1, prj2) => getNewIndex(prj1) - getNewIndex(prj2));
      return projects;
    }

    var loadProjectsWithCharities = function () {
      ProjectService.getProjects().then(function (projects) {
        vm.projects = doHackForFusionHousing(projects.data);
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
