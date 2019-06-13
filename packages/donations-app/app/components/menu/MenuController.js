angular.module('aliceApp')
  .controller('MenuController', ['$state', '$scope', '$rootScope', 'AuthService', function ($state, $scope, $rootScope, AuthService) {
    var vm = this, navHeight = $('#navbar-menu').height();
    vm.$state = $state;
    vm.auth = AuthService;

    const statesWithoutMenu = ['oauth2'];
    const statesWithTransparentMenu = [
      'home',
      'how-it-works',
      'geek-mode',
      'faq',
      'project',
      'project-simple',
      'validation-goals-dashboard',
      'charity-dashboard-project',
      'my-impact-project'
    ];
    $scope.menuColoured = false;
    $scope.breadcrumb = false;
    $scope.onDaiPage = false;

    vm.logOut = function () {
      AuthService.logout();
      $state.go("home");
    };

    vm.logIn = function () {
      AuthService.showLogInModal();
    };

    vm.signUp = function () {
      AuthService.showSignUpModal();
    };

    // Hide on Scroll.
    $(window).scroll(function () {
      var scrollPos = $(window).scrollTop();
      if(!$scope.onDaiPage) {
        if (scrollPos > 1 && !$scope.menuColoured) {
          $('#navbar-menu').css({ top: '-' + navHeight + 'px', opacity: '0'});
        }
        else {
          $('#navbar-menu').css({ top: '0', opacity: '100'});
        }
      }
    });

    $rootScope.$on('$stateChangeSuccess', function (event, state) {
      changeMenuForState(state.name);
    });

    // Change menu template url on certain states;
    function changeMenuForState (state) {
      if (!state) {
        state = '' + $state.$current;
      }

      $scope.menuColoured = false;
      $scope.menuHidden = true;
      if(statesWithTransparentMenu.includes(state)) {
        $scope.menuColoured = false;
      }
      else {
        $scope.menuColoured = true;
      }

      if (statesWithoutMenu.includes(state)) {
        $scope.menuHidden = true;
      } else {
        $scope.menuHidden = false;
      }
    }

    return vm;
  }])

  .directive('menuHeader', function () {
    return {
      templateUrl: '/components/menu/menuHeaderTemplate.html'
      };
  });
