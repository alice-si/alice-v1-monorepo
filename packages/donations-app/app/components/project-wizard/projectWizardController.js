angular.module('aliceApp')

  .controller('ProjectWizardController', ['ProjectService', 'NotificationService', 'AuthService', '$stateParams', '$http', 'API', '$state', function (ProjectService, NotificationService, AuthService, $stateParams, $http, API, $state) {
    var vm = this;
    vm.auth = AuthService;
    vm.modes = {
      GENERAL: 'GENERAL',
      TARGETS: 'TARGETS',
      SUMMARY: 'SUMMARY',
      OUTCOMES: 'OUTCOMES',
      STORIES: 'STORIES'
    };

    if (!AuthService.getLoggedUser()) {
      AuthService.showLogInModal();
      loadData();
    }

    if (document.readyState == "complete") {
      loadData();
    } else {
      window.onload = loadData;
    }

    vm.selectSection = function (sectionName) {
      if (!visibleFormPartIsValid()) {
				printErrors();
      } else {
        vm.selectedOutcome = null;
        vm.selectedStory = null;
        vm.mode = sectionName;
        if (vm.mode == vm.modes.OUTCOMES) {
          vm.outcomesOpen = !vm.outcomesOpen;
        } else {
          vm.outcomesOpen = false;
        }
        if (vm.mode == vm.modes.STORIES) {
          vm.storiesOpen = !vm.storiesOpen;
        } else {
          vm.storiesOpen = false;
        }
      }
    };

    vm.selectStory = function (story) {
      if (!visibleFormPartIsValid()) {
				printErrors();
      } else {
        vm.selectedStory = story;
      }
    };

    vm.selectOutcome = function (outcome) {
      vm.selectedOutcome = outcome;
    };

    vm.addOutcome = function () {
      vm.project.outcomes.push({});
      this.selectedOutcome = vm.project.outcomes[vm.project.outcomes.length - 1];
    };

    vm.removeOutcome = function (outcome, $event) {
      $event.stopPropagation();
      vm.project.outcomes = vm.project.outcomes.filter(function (el) {
        return el !== outcome;
      });
    };

    vm.addStory = function () {
      vm.project.myStory.push({});
      this.selectedStory = vm.project.myStory[vm.project.myStory.length - 1];
    };

    vm.removeStory = function (story, $event) {
      $event.stopPropagation();
      vm.project.myStory = vm.project.myStory.filter(function (el) {
        return el !== story;
      });
    };

    vm.submitSaveProject = function () {
      vm.projectForm.$submitted = true;
      if (vm.projectForm.$valid) {
				vm.project.outcomes.forEach((elem) => {
					elem.target = elem.costPerUnit * elem.quantityOfUnits;
				});
				console.log(vm.project);
        ProjectService.saveProjectWithOutcomes(vm.project)
          .then(function (response) {
            NotificationService.success("Project has been successfully saved.");
            $state.go('project-wizard', {code: response.data.code});
          });
      } else {
				printErrors();
      }
    };

    function getErrors() {
      var errorsRequired = vm.projectForm.$error.required;
      var errorsMaxLength = vm.projectForm.$error.maxlength;
      var errors = [];
      if (errorsMaxLength) {
        errors = errors.concat(errorsMaxLength);
      }
      if (errorsRequired) {
        errors = errors.concat(errorsRequired);
      }
      return errors;
    }

		function printErrors() {
			var fields = getErrors().map(elem => { return elem.$name; });
			NotificationService.error("Please fix validation errors before changing section, check the following: " + fields);
		}

    function visibleFormPartIsValid() {
			if (!vm.projectForm.$valid) {
        const errors = getErrors();
        return errors.reduce(function (acc, el) {
          var domEl = $("[name='" + el.$name + "']");
          el.$setTouched();
          if (isVisible(domEl)) {
            acc = false;
          }
          return acc;
        }, true);
      } else {
        return true;
      }
    }

    function isVisible(domEl) {
      const isSummernoteVisible = domEl[0].attributes.summernote && domEl.next().is(':visible');
      const isCasualElementVisible = domEl.is(':visible');
      return isCasualElementVisible || isSummernoteVisible;
    }

    function loadData() {
      updateProject($stateParams.code);
      if (AuthService.isSuperadmin()) {
        updateCharities();
      }
      vm.mode = vm.modes.GENERAL;
    }

    function updateProject(code) {
      if (code) {
        ProjectService.getProjectDetails(code).then(function (response) {
          vm.project = response.data;
          vm.project.outcomes = vm.project._outcomes;
        }, function (err) {
          $state.go("404");
        });
      } else {
        vm.project = {myStory: [], outcomes: []};
      }
    }

    function updateCharities() {
      $http.get(API + 'getCharitiesForAdmin').then(function (response) {
        vm.charities = response.data;
      });
    }

    return vm;
  }]);
