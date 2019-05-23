angular.module('aliceApp')
  .controller('HomeController', ['ProjectService', 'NotificationService', 'API', '$location', '$http', function (ProjectService, NotificationService, API, $location, $http) {
    var vm = this, navHeight = $('#navbar-menu').height();

    var loadData = function () {
      vm.contact = {};
      ProjectService.getPilotProject().then(function (pilotProject) {
        vm.project = pilotProject.data;
        ProjectService.getProjectDetails(vm.project.code).then(function (result) {
          vm.details = ProjectService.prepareProjectDetails(result.data);

        });
      });

      ProjectService.getCategories().then(function (res) {
        vm.categories = res.data;
      });

      vm.projects = [];
      ProjectService.getActiveProjects().then(function (projects) {
        projects.data.forEach(function (project,key) {
          if(key < 3) {
            ProjectService.getProjectDetails(project.code).then(function (result) {
              //Only push active projects for viewing.
              // if(result.data.status === "ACTIVE") {
                var p = {
                  projectTitle: project.title,
                  projectCode: project.code,
                  projectCharity: result.data.charityLegalName,
                  projectDetails: result.data.lead,
                  projectImage: result.data.img
                };
              // }
              // else {
              //   key--;
              // }
              vm.projects.push(p);
            });
          }
        });
      });

      $http.get(API + 'getCharities').then(function (response) {
          vm.charities = response.data;
        }
      );
    };

    loadData();

    // url with param action=startProject scrolls down to fundraise section
    $(window).bind("load", function () {
      if ($location.$$search.action == 'startProject') {
        $('html, body').animate({
          scrollTop: $(".home-fundraise-wrapper").offset().top
        }, 900);
      }
    });

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

  }]);
