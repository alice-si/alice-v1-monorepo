angular.module('aliceApp')
  .controller('ProjectController', ['$stateParams', 'ProjectService', '$timeout', '$scope', 'REDIRECTION', '$state', 'CheckoutService',  function($stateParams, ProjectService, $timeout, $scope, REDIRECTION, $state, CheckoutService) {
    var vm = this;

    ProjectService.getProjectDetails($stateParams.projectCode).then(function (result) {
      vm.model = ProjectService.prepareProjectDetails(result.data);
			vm.supporters = result.data.supporters;
			vm.model.goals = _.chunk(vm.model._outcomes, 3);

			vm.model.projectShareLink = REDIRECTION + 'redirection/project-' + vm.model.code + '.html';

      // For every story, match each p tag of a story's details and replace
      // myStory.details with an array of 'paragraph' objects
      let parseRegex = /<p>([^<]*)<\/p\>\s*/;
      vm.model.myStory.forEach(function(story) {
				let details = story.details + story.extendedDetails;
        let storyObject = details.split(parseRegex);
        story.details = [];
        storyObject.forEach(function(para) {
          if (para !== '') {
            let p = { paragraph : '' + para + '' };
            this.push(p);
          }
        }, story.details);
      });

      // For Summary/Project Details - Parse through input and create p-tag arrays
			// Provides more control over the data for the front-end.
			let pTagArray = function(inputArray, formattedArray) {
				inputArray.forEach(function(para) {
					if (para !== '') {
	          let p = { paragraph : "<p>" + para + "</p>" };
	          formattedArray.push(p);
	        }
				});
	    };
			vm.model.projectLines = [];
			var proj = vm.model.project.split(parseRegex);
      pTagArray(proj, vm.model.projectLines);


			// For the Overlay
			$scope.openModal = '';
			$scope.trackImpact = false;
			$scope.aliceGraph = false;

			function makeOverlay(img, title, details) {
				return { img: img, title: title, details: details };
			}

      $scope.clickForOverlay = function (id) {
				$scope.openModal = 'overlay-active';
				switch(id) {
					case 'firstStory':
						$scope.overlay = makeOverlay(vm.model.myStory[0].img, vm.model.myStory[0].header, vm.model.myStory[0].details);
						break;
					case 'secondStory':
						$scope.overlay = makeOverlay(vm.model.myStory[1].img, vm.model.myStory[1].header, vm.model.myStory[1].details);
						break;
					// TODO - In our design, we only ever use 2 for an appeal, didn't make sense to create a more dynamic function (for now)
					case 'projectDetails':
						$scope.overlay = makeOverlay(vm.model.img, 'Project Details', vm.model.projectLines);
						break;
					case 'trackImpact':
						$scope.trackImpact = true;
						$scope.overlay = makeOverlay('', 'Tracking your impact', [{'paragraph' : ''}]);
						break;
					case 'aliceOverlay':
						$scope.aliceGraph = true;
						$scope.overlay = makeOverlay('https://s3.eu-west-2.amazonaws.com/alice-res/Alice_graph.png', 'How Does Alice Work', [{'paragraph' : 'Donating on Alice is different to donating anywhere else. You only give your full donation when the charity has achieved its goals.'}]);
						break;
					default:
						break;
				}
				$('#overlayContainer').fadeIn(100);
      };

			$scope.closeOverlay = function() {
				$scope.trackImpact = false;
				$scope.aliceGraph = false;
				$('#overlayContainer').fadeOut(10);
				$scope.openModal = '';
			};

      // Scrolling functions
      var previousScroll = 0,
      navHeight = $('#navbar-menu').height();
			$scope.menuColoured = false;

      $('a[href*="#"]').click(function(event) {
          var target = $(this.hash);
          target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
          if (target.length) {
            event.preventDefault();
            $('html, body').animate({
              scrollTop: target.offset().top
            }, 900);
          }
      });

      $(window).scroll(function () {
        var scrollPos = $(window).scrollTop();
        if (scrollPos > navHeight) {
					$scope.menuColoured = true;
        }
        else {
					$scope.menuColoured = false;
        }
      });
    }, function (err) {
			$state.go("404");
		});

    vm.donate = function() {
      CheckoutService.startCheckout(vm.model);
		}

  }])
  .directive('projectSplash', function() {
    return {
      scope: {
        model: '=',
				onDonate: '&'
      },
      templateUrl: '/components/project/projectSplashTemplate.html'
    };
  })
	.directive('socialIcons', function() {
    return {
			scope: {
				model: '=',
			},
      templateUrl: '/components/project/projectSocials.html',
    };
  });
