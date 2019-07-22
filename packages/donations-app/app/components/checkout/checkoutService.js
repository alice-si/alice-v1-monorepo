angular.module('aliceApp')
  .service('CheckoutService', ['$rootScope', '$uibModal', 'MANGO', 'AuthService', 'NotificationService', '$http', 'API', '$q', function ($rootScope, $uibModal, MANGO, AuthService, NotificationService, $http, API, $q) {

    // Set MANGOPAY API base URL and Client ID
    mangoPay.cardRegistration.baseURL = MANGO.url;
    mangoPay.cardRegistration.clientId = MANGO.clientId;

    const MANGO_TEST_CARD = "4706750000000009";
    const MANGO_TEST_CARD_3DS = "3569990000000157"; // For testing of payments over 50EUR

    var registerCard = function(card) {
      return $q(function(resolve, reject) {
        $http.get(API + "preRegisterCard").then(function (preRegistrationResponse) {
          mangoPay.cardRegistration.init({
            cardRegistrationURL: preRegistrationResponse.data.CardRegistrationURL,
            preregistrationData: preRegistrationResponse.data.PreregistrationData,
            accessKey: preRegistrationResponse.data.AccessKey,
            Id: preRegistrationResponse.data.Id
          });

          resolve({
            userId: preRegistrationResponse.data.userId,
            cardType: "CB_VISA_MASTERCARD",
            cardNumber: card.number,
            cardExpirationDate: card.expiryDate.replace('/', ''),
            cardCvx: card.cvc
          });
        }, function (err) {
          recordError(err);
          reject(err);
        });
      });
    };


    this.donate = function () {
      var self = this;
      return $q(function(resolve, reject) {
        registerCard(self.card).then(function (cardData) {

          let supported3DS = false;

          mangoPay.cardRegistration.registerCard(cardData,
            function (cardRegistrationResult) {
              return $http.get(API + 'check3DSSupport/' + cardRegistrationResult.CardId).then(function (securitySupportResult) {
                  supported3DS = securitySupportResult.data.supported3DS;
                  self.donation.cardId = cardRegistrationResult.CardId;
                  //FIXME: Remove after stage testing
                  console.log("Is 3DS supported by card: " + supported3DS);

                  if (self.donation.amount >= securitySupportResult.data.securityTreshold && !supported3DS) {
                    throw {type: 'securityModeUnsupported'};
                  }
                  //FIXME: Remove after stage testing
                  console.log(self.donation);
                  return $http.post(API + 'sendDonation', self.donation);
                }
              ).then(function (result) {
                if (result.data.status == 'SUCCEEDED') {
                  resolve(result.data);//no 3ds required
                } else {
                  if (result.data.secureModeNeeded) {
                    //FIXME: Remove after stage testing
                    console.log(result.data);
                    if (!supported3DS) {
                      console.error('3DS was enforced but is not available');
                      throw {type: 'securityModeUnsupported'};
                    }
                    console.log("URL: " + result.data.redirectUrl);
                    resolve(result.data);
                  }

                }
              }).catch(function (failure) {
                console.error(failure);
                if (failure && failure.type == 'securityModeUnsupported') {
                  NotificationService.error(`Unfortunately your card doesn't support 3DS security verification. Please choose smaller amount or use card issued in the Euro zone`);
                } else {
                  NotificationService.error("Your bank issuer has declined the transaction, please contact them to be able to donate");
                }
                reject(failure);
              });
            },
            function (err) {
              recordError(err);
              reject(err);
            })
        })
      });
    };

    var self = this;
    $rootScope.$on('user:login', function (event, data) {
      self.card.name = AuthService.getLoggedFullName();
      self.donation.user = AuthService.getLoggedUser();
    });


    this.startCheckout = function (project) {
      this.project = project;
      this.card = {
        name: AuthService.getLoggedFullName()
      };
      this.donation = {
        amount: 0,
        projectId: project._id,
        user: AuthService.getLoggedUser(),
        type: 'CARD'
      };

      if (MANGO.url == 'https://api.sandbox.mangopay.com') {
        angular.extend(this.card, {
          number: MANGO_TEST_CARD,
          expiryDate: "11/20",
          cvc: "123"
        });
      }

      this.showCheckout();
    };

    this.showCheckout = function () {
      $uibModal.open({
        templateUrl: '/components/checkout/checkoutModal.html',
        controller: 'CheckoutController as checkCtrl'
      });
    };

    this.showQuestion = function () {
      $uibModal.open({
        templateUrl: '/components/checkout/donationProcessingModal.html',
        controller: 'DonationProcessingController as dpCtrl'
      });
    };

    this.showConfirmation = function () {
      $uibModal.open({
        templateUrl: '/components/checkout/donationConfirmationModal.html',
        controller: ['$scope', '$state', '$timeout', 'HOST', 'AuthService', 'CheckoutService', function ($scope, $state, $timeout, HOST, AuthService, CheckoutService) {
          $scope.donation = CheckoutService.donation;
          $scope.loggedUser = AuthService.getLoggedUser();
          $scope.host = HOST;
          $scope.projectTitle = CheckoutService.project.title;
          $scope.projectShareLink = HOST + 'redirection/project-' + CheckoutService.project.code + '.html';
          $scope.projectCode = CheckoutService.project.code;

          $scope.goToMyImpact = function() {
            $scope.$dismiss();
            $state.go('my-impact');
          };

          $timeout(function () {
            FB.XFBML.parse();
          });
        }]
      });
    };

    var recordError = function (err, payment) {
      NotificationService.error("Unfortunately we cannot process your credit card.");
      console.log(err);
      // recording error in DB
      payment.err = 'Card registration error: ' + JSON.stringify(err);
      $http.post(API + 'recordDonationError', this.donation);
    };

  }]);
