angular.module('aliceApp')

  .service('AuthService', ['$q', '$http', '$rootScope', 'jwtHelper', 'UserService', '$uibModal', 'API', '$state', function ($q, $http, $rootScope, jwtHelper, UserService, $uibModal, API, $state) {
    var LOCAL_TOKEN_KEY = 'openReferenceToken';
    var LOGGED_IN_AS_ANOTHER_USER_KEY = 'loggedInAsAnotherUser';
    var loggedUser;
    var isAuthenticated = false;
    var authToken;
    var afterLoginFunction;
    var emailForSignupFinishing;

    $rootScope.$on('user:update', function (event, data) {
      setLoggedUser(data);
    });

    var setLoggedUser = function (user) {
      angular.extend(loggedUser, user);
      $rootScope.$broadcast('user:login', loggedUser);
      //nudgespot.identify(loggedUser.email, loggedUser);
      if (afterLoginFunction) {
        afterLoginFunction();
        afterLoginFunction = null;
      }
    };

    function loadUserCredentials() {
      var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
      if (token) {
        useCredentials(token);
      }
    }

    function storeUserCredentials(token, loggedAsAnotherUser) {
      window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
      useCredentials(token);
      if (loggedAsAnotherUser) {
        window.localStorage.setItem(LOGGED_IN_AS_ANOTHER_USER_KEY, true);
      } else {
        window.localStorage.setItem(LOGGED_IN_AS_ANOTHER_USER_KEY, false);
      }
    }

    function useCredentials(token) {
      try {
        if (jwtHelper.isTokenExpired(token)) {
          throw 'Token expired';
        }
        authToken = token;
        const tokenPayload = jwtHelper.decodeToken(authToken);
        const {userId} = tokenPayload;
        if (!userId) {
          throw 'Token is invalid';
        }
        isAuthenticated = true;
        loggedUser = {_id: userId};

        // Set the token as header for your requests!
        $http.defaults.headers.common.Authorization = authToken;

        UserService.loadUserDetails(userId).then(
          function (response) {
            setLoggedUser(response.data);
          }, function (failure) {
            throw failure.data;
          });
      } catch (err) {
        console.error('Can not use credentials');
        console.error(err);
        destroyUserCredentials();
      }
    }

    function destroyUserCredentials() {
      authToken = undefined;
      isAuthenticated = false;
      $http.defaults.headers.common.Authorization = undefined;
      window.localStorage.removeItem(LOCAL_TOKEN_KEY);
    }

    this.register = function (user) {
      return $http.post(API + 'signup', user);
    };

    /*
      Create new simple user
      After creation set JWT token with simple user id encoded
    */
    this.registerEmail = function (email) {
      return $http.post(API + 'registerEmail', {email}).then((result) => {
        if (result && result.data && result.data.token) {
          // Set the token as header for your requests
          $http.defaults.headers.common.Authorization = result.data.token;
          if (afterLoginFunction) {
            afterLoginFunction();
          }
        }
      });
    };

    this.login = function (credentials) {
      return $q(function (resolve, reject) {
        $http.post(API + 'authenticate', credentials).then(function (result) {
          if (result.data && result.data.token) {
            storeUserCredentials(result.data.token);
            resolve(result.data.msg);
          } else {
            reject(result.data.msg);
          }
        });
      });
    };

    this.logInAsAnotherUser = function (email) {
      return $http.post(API + 'authenticateAsAnotherUser', { email }).then(function (result) {
        if (result.data && result.data.token) {
          storeUserCredentials(result.data.token, true);
          return result.data.token;
        } else {
          throw new Error(`Authentication for user "${email}" failed`);
        }
      });
    };

    this.loggedInAsAnotherUser = function () {
      let isLoggedInAsAnotherUser = window.localStorage.getItem(LOGGED_IN_AS_ANOTHER_USER_KEY);
      return isLoggedInAsAnotherUser == 'true';
    }

    this.resetPassword = function (credentials) {
      return $q(function (resolve, reject) {
        $http.post(API + 'resetPassword', credentials.email).then(function (result) {
            resolve(result.data);
          }, function (failure) {
            reject(failure.data);
          }
        );
      });
    };

    this.logout = function () {
      loggedUser = undefined;
      destroyUserCredentials();
      $rootScope.$broadcast('user:logout');
    };

    this.acceptInvitation = function (invitedUser) {
      return $http.post(API + 'acceptInvitation', invitedUser);
    };

    this.resetPassword = function (credentials) {
      return $http.post(API + 'resetPassword', credentials);
    };

    this.changePassword = function (credentials) {
      return $http.post(API + 'changePassword', credentials);
    };

    loadUserCredentials();

    this.stillLoading = function () {
      return loggedUser && loggedUser._id && !loggedUser.email;
    };

    this.getLoggedUser = function () {
      return loggedUser;
    };

    this.isSuperadmin = function () {
      return loggedUser && loggedUser.superadmin;
    };

    this.isAdmin = function () {
      return checkUserAccess(loggedUser, "adminAccess") || checkUserAccess(loggedUser, "charityAdminAccess");
    };

    this.isManager = function () {
      return checkUserAccess(loggedUser, "managerAccess") || checkUserAccess(loggedUser, "charityAdminAccess");
    };

    this.isCharityAdmin = function () {
      return loggedUser && loggedUser.charityAdmin;
    };

    this.getCharityCodeForCharityAdmin = function () {
      if (loggedUser && loggedUser.charityForCharityAdmin && loggedUser.charityForCharityAdmin.code) {
        return loggedUser.charityForCharityAdmin.code;
      } else {
        return null;
      }
    };

    this.isValidator = function () {
      return checkUserAccess(loggedUser, "validator");
    };

    this.hasValidatorAccess = projectCode => {
      if (!loggedUser) return false;
      let isSuperadmin = loggedUser.superadmin;
      let isValidator =
        loggedUser.validatorCodes
        && loggedUser.validatorCodes.includes(projectCode);

      return isSuperadmin || isValidator;
    };

    this.getLoggedFullName = function () {
      if (loggedUser === null || loggedUser === undefined) return null;
      return loggedUser.firstName + " " + loggedUser.lastName;
    };

    this.isAuthenticated = function () {
      return isAuthenticated;
    };

    this.showLogInModal = function (followUp) {
      afterLoginFunction = followUp;
      $uibModal.open({
        templateUrl: '/components/auth/loginModal.html',
        controller: 'LoginController',
        controllerAs : 'loginCtrl',
        resolve: {
            modalMode : function() {
                 return 'LOGIN'
            }
        }
      });
    };

    this.getEmailForSignupFinishing = function () {
      return emailForSignupFinishing;
    };

    this.showSignUpModal = function (followUp, email) {
      afterLoginFunction = followUp;
      emailForSignupFinishing = email;
      $uibModal.open({
        templateUrl: '/components/auth/registrationModal.html'
      });
    };

    this.hasAfterLoginFunction = function() {
      return (typeof afterLoginFunction != 'undefined' && afterLoginFunction);
    };

    function checkUserAccess(user, field) {
      return user && ((user[field] && user[field].length > 0) || user.superadmin);
    }

  }])

  .factory('AuthInterceptor', ['$rootScope', '$q', 'AUTH_EVENTS', function ($rootScope, $q, AUTH_EVENTS) {
    return {
      responseError: function (response) {
        $rootScope.$broadcast({
          401: AUTH_EVENTS.notAuthenticated
        }[response.status], response);
        return $q.reject(response);
      }
    };
  }])

  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
  }]);
