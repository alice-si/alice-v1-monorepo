angular.module('aliceApp')
  .controller('CheckoutController', ['$rootScope', '$uibModal', '$http', '$stateParams', '$state', '$sce', '$timeout', 'AuthService', 'ProjectService', 'NotificationService', 'API', '$scope', 'MANGO', function ($rootScope, $uibModal, $http, $stateParams, $state, $sce, $timeout, AuthService, ProjectService, NotificationService, API, $scope, MANGO) {

    // Set MANGOPAY API base URL and Client ID
    mangoPay.cardRegistration.baseURL = MANGO.url;
    mangoPay.cardRegistration.clientId = MANGO.clientId;

    var amounts = {
      amount10: 1000,
      amount25: 2500,
      amount50: 5000,
      amount100: 10000,
      amountOther: 0
    };


    var vm = this;
    vm.validatedGuest = false;
    vm.guest = {};
    vm.auth = AuthService;
    vm.mode = 'CARD'; // enum: ["CARD", "3DS", "BANK_TRANSFER", "BANK_TRANSFER_REQUESTED"]

    vm.card = {};

    if (MANGO.url == 'https://api.sandbox.mangopay.com') {
      vm.card = {
        number: "3569990000000132",
        expiryDate: "11/20",
        cvc: "123",
        name: AuthService.getLoggedFullName()
      };
    }

    ProjectService.getProjectDetails($stateParams.projectCode).then(function (project) {
      vm.project = project.data;
    });

    if (AuthService.getLoggedUser()) {
      vm.card.name = AuthService.getLoggedUser().firstName + " " + AuthService.getLoggedUser().lastName;
      vm.user = AuthService.getLoggedUser();
    }

    $rootScope.$on('user:login', function (event, data) {
      vm.card.name = AuthService.getLoggedFullName();
      vm.user = AuthService.getLoggedUser();
      if (!vm.user._id && vm.user.address1) {
        AuthService.getLoggedUser().address1 = vm.user.address1;
        AuthService.getLoggedUser().address2 = vm.user.address2;
        AuthService.getLoggedUser().city = vm.user.city;
        AuthService.getLoggedUser().postCode = vm.user.postCode;
      }
    });

    var rescale = function () {
      vm.iframeScale = Math.min(1, window.innerWidth / 500);
    };

    rescale();

    $(window).resize(function () {
      $scope.$apply(rescale);
    });

    vm.onAmountChange = function (target) {
      if (vm[target]) {
        vm.amount = amounts[target];
        vm.noAmount = false;
        if (target != 'amountOther') {
          vm.amountOtherValue = null;
        }
        Object.keys(amounts).forEach(function (key) {
          if (key != target) {
            vm[key] = false;
          }
        });
      } else {
        vm.amount = 0;
      }
    };

    vm.onOtherChange = function () {
      vm.amount = vm.amountOtherValue * 100;
    };

    vm.validateGuest = function () {
      vm.guestForm.$submitted = true;
      if (vm.guestForm.$valid) {
        vm.validatedGuest = true;
      }
    };

    vm.signIn = function () {
      $uibModal.open({
        templateUrl: '/components/auth/loginModal.html'
      });
    };

    vm.setMode = function (mode) {
      vm.mode = mode;
    };

    var postDonationConfirmation = function () {
      if (AuthService.getLoggedUser()) {
        $state.go('my-impact');
      } else {
        // User made an anonymous donation
        // So he currently has no privelleges to see his impact
        $state.go('project', {projectCode: $stateParams.projectCode});
      }


      $uibModal.open({
        templateUrl: '/components/checkout/donationConfirmationModal.html',
        controller: ['$scope', '$state', '$timeout', 'donation', 'projectCode', 'projectTitle', 'HOST', 'AuthService', function ($scope, $state, $timeout, donation, projectCode, projectTitle, HOST, AuthService) {
          $scope.donation = donation;
          $scope.loggedUser = AuthService.getLoggedUser();
          $scope.host = HOST;
          $scope.projectTitle = projectTitle;
          $scope.projectShareLink = HOST + 'redirection/project-' + projectCode + '.html';
          $scope.returnToAppeal = function () {
            $scope.$dismiss();
            $state.go('project', {projectCode: projectCode});
          };
          $scope.projectCode = projectCode;
          $timeout(function () {
            FB.XFBML.parse();
          });
        }],
        resolve: {
          donation: function () {
            return vm.amount;
          },
          projectCode: function () {
            return vm.project.code;
          },
          projectTitle: function () {
            return vm.project.title;
          }
        }
      });
    };

    var successfullyDonated = function (donation) {
      return donation.status == 'CREATED' || donation.status == 'BIG_TRANSFER_CREATED';
    };

    var checkDonationStatus = function (donationId) {
      $http.get(API + 'checkDonationStatus/' + donationId).then(function (result) {
        var donation = result.data;
        console.log(donation);
        if (successfullyDonated(donation)) {
          postDonationConfirmation();
        } else if (result.data.status == 'FAILED') {
          NotificationService.error("Your bank verification was incorrect – please try again. If you keep getting this error, contact your credit card issuer to resolve the issue.");
          vm.mode = 'CARD';
        } else {
          $timeout(function () {
            checkDonationStatus(donationId);
          }, 1000);
        }
      });
    };

    var sendDonation = function () {
      if (vm.user) {
        vm.user.giftAid = vm.giftAid || (vm.user.giftAid === true);
      }

      if (vm.mode == 'CARD') {
        sendDonationByCard();
      } else if (vm.mode == 'BANK_TRANSFER') {
        sendDonationByBankTransfer();
      }
    };

    var recordError = function(err, payment) {
      disableOverlaySpinner();
      NotificationService.error("Unfortunately we cannot process your credit card.");
      console.log(err);
      // recording error in DB
      payment.err = 'Card registration error: ' + JSON.stringify(err);
      $http.post(API + 'recordDonationError', payment);
    };

    var sendDonationByCard = function () {
      var payment = {
        amount: vm.amount,
        projectId: vm.project._id,
        giftAid: vm.giftAid,
        user: vm.user,
        type: 'CARD'
      };

      $http.get(API + "preRegisterCard").then(function (preRegistrationResponse) {
        mangoPay.cardRegistration.init({
          cardRegistrationURL: preRegistrationResponse.data.CardRegistrationURL,
          preregistrationData: preRegistrationResponse.data.PreregistrationData,
          accessKey: preRegistrationResponse.data.AccessKey,
          Id: preRegistrationResponse.data.Id
        });
        var cardData = {
          userId: preRegistrationResponse.data.userId,
          cardType: "CB_VISA_MASTERCARD",
          cardNumber: vm.card.number,
          cardExpirationDate: vm.card.expiryDate.replace('/', ''),
          cardCvx: vm.card.cvc
        };

        let supported3DS = false;

        mangoPay.cardRegistration.registerCard(cardData,
          function (cardRegistrationResult) {
            return $http.get(API + 'check3DSSupport/'
              + cardRegistrationResult.CardId).then(function (securitySupportResult) {
                supported3DS = securitySupportResult.data.supported3DS;
                payment.cardId = cardRegistrationResult.CardId;

                // 3DS disabled for non-eurozone
                // if (payment.amount >= securitySupportResult.data.securityTreshold && !supported3DS) {
                //   throw {type: 'securityModeUnsupported'};
                // }

                return $http.post(API + 'sendDonation', payment);
              }
            ).then(function (result) {
              disableOverlaySpinner();
              if (result.data.status == 'SUCCEEDED') {
                postDonationConfirmation();
              } else {
                if (result.data.secureModeNeeded) {
                  // 3DS disabled for non-eurozone
                  // if (!supported3DS) {
                  //   console.error('3DS was enforced but is not available');
                  //   throw {type: 'securityModeUnsupported'};
                  // }
                  vm.mode = '3DS';
                  vm.secureModeUrl = $sce.trustAsResourceUrl(result.data.redirectUrl);
                }
                checkDonationStatus(result.data.donation._id);
              }
            }).catch(function (failure) {
              console.error(failure);
              disableOverlaySpinner();
              if (failure && failure.type == 'securityModeUnsupported') {
                NotificationService.error(`Unfortunately your card doesn't support 3DS security verification. Please choose smaller amount or use card issued in EU`);
              } else {
                NotificationService.error("Your bank issuer has declined the transaction, please contact them to be able to donate");
              }
            });
          },
          function (err) {
            recordError(err, payment);
          }
        );
      }, function (err) {
        recordError(err, payment);
      });
    };

    var formatDonationMoney = function (donation) {
      return '£' + Number(donation.amount / 100).toFixed(2);
    };

    var enableOverlaySpinner = function () {
      vm.waiting = true;
    };

    var disableOverlaySpinner = function () {
      vm.waiting = false;
    };

    var sendDonationByBankTransfer = function () {
      var payment = {
        amount: vm.amount,
        projectId: vm.project._id,
        giftAid: vm.giftAid,
        user: vm.user,
        type: 'BANK_TRANSFER'
      };
      return $http.post(API + 'sendDonation', payment).then(function (result) {
        disableOverlaySpinner();
        console.log(result.data);
        NotificationService.success("Your donation request has been successfully saved");
        vm.setMode('BANK_TRANSFER_REQUESTED');
        vm.donation = result.data.donation;
        vm.donation.money = formatDonationMoney(vm.donation);
      }, function (failure) {
        disableOverlaySpinner();
        console.log(failure);
        NotificationService.error("Unfortunately we cannot get bank details for this donation.");
      });
    };

    vm.question = function () {
      $uibModal.open({
        templateUrl: '/components/checkout/donationQuestionModal.html',
        controller: ['$scope', 'donation', 'donate', function ($scope, donation, donate) {
          $scope.donation = donation;
          $scope.donate = function () {
            $scope.$dismiss();
            ga('send', 'event', 'donation', 'confirmDonation', $stateParams.projectCode, vm.amount/100);
            donate();
          };
        }],
        resolve: {
          donation: function () {
            return vm.amount;
          },
          donate: function () {
            return sendDonation;
          }
        }
      });
    };

    var performDonation = function () {
      vm.amount = (vm.amountOther ? vm.amountOtherValue * 100 : vm.amount) || 0;
      if (vm.amount === 0) {
        vm.noAmount = true;
        return;
      }

      if ((vm.mode == 'CARD' && !vm.cardForm.$valid) || (vm.mode == 'BANK_TRANSFER' && !vm.bankForm.$valid)) {
        return;
      }

      ga('send', 'event', 'donation', 'donateFromCheckout', $stateParams.projectCode, vm.amount/100);
      enableOverlaySpinner();
      if (!AuthService.getLoggedUser()) {
        AuthService.showLogInModal(vm.question);
      } else {
        if (vm.mode == 'BANK_TRANSFER') {
          sendDonation(); // get bank details to show
        } else {
          vm.question(); // show modal confirmation window
        }
      }

    };

    vm.donate = function () {
      if (vm.project === undefined) {
        ProjectService.getProjectDetails($stateParams.projectCode).then(function (result) {
          vm.project = result.data.project;
          performDonation();
        });
      } else {
        performDonation();
      }
    };

    $scope.$watch("checkCtrl.giftAid", function () {
      $("#gift-aid-details").slideToggle(500);
    });

    return vm;
  }]);
