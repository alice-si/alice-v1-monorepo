angular.module('aliceApp')
  .controller('CheckoutController', ['$rootScope', '$uibModal', '$http', '$stateParams', '$state', '$sce', '$timeout', 'AuthService', 'ProjectService', 'NotificationService', 'API', '$scope', 'MANGO', 'CheckoutService', function ($rootScope, $uibModal, $http, $stateParams, $state, $sce, $timeout, AuthService, ProjectService, NotificationService, API, $scope, MANGO, CheckoutService) {
    var vm = this;

    const ADD_AMOUNT_VALUE = 1000;
    const DEFAULT_DONATION_AMOUNT = 3000;

    vm.validatedGuest = false;
    vm.guest = {};
    vm.auth = AuthService;

    //TODO: Consider binding that to CheckoutService.donation.type, after we've got the bank mode
    vm.mode = 'CARD';  // enum: ["CARD", "3DS", "BANK_TRANSFER", "BANK_TRANSFER_REQUESTED"]

    vm.setMode = function (mode) {
      vm.mode = mode;
    };

    vm.card = CheckoutService.card;
    vm.project = CheckoutService.project;
    vm.donation = CheckoutService.donation;
    vm.donation.amount = DEFAULT_DONATION_AMOUNT;

    vm.validateGuest = function () {
      vm.guestForm.$submitted = true;
      if (vm.guestForm.$valid) {
        vm.validatedGuest = true;
      }
    };

    vm.donate = function () {
      vm.donation.amount = (vm.amountOther ? vm.amountOtherValue * 100 : vm.donation.amount) || 0;
      if (vm.donation.amount === 0) {
        vm.noAmount = true;
        return;
      }

      if ((vm.mode == 'CARD' && !vm.cardForm.$valid) || (vm.mode == 'BANK_TRANSFER' && !vm.bankForm.$valid)) {
        return;
      }

      ga('send', 'event', 'donation', 'donateFromCheckout', $stateParams.projectCode, vm.amount/100);


      $scope.$dismiss();

      //TODO: Consider moving that to the checkout service as well
      if (!AuthService.getLoggedUser()) {
        AuthService.showLogInModal(CheckoutService.showQuestion);
      } else {
        if (vm.mode == 'BANK_TRANSFER') {
          sendDonationByBankTransfer(); // get bank details to show
        } else {
          CheckoutService.showQuestion();
        }
      }
    };

    vm.addAmount = function () {
      vm.donation.amount += ADD_AMOUNT_VALUE;
    }

    vm.subtractAmount = function () {
      if (vm.donation.amount >= ADD_AMOUNT_VALUE) {
        vm.donation.amount -= ADD_AMOUNT_VALUE;
      }
    }


    //TODO: Work on bank transfer once we've got a design for it
    var formatDonationMoney = function (donation) {
      return '£' + Number(donation.amount / 100).toFixed(2);
    };

    var sendDonationByBankTransfer = function () {
      var payment = {
        amount: vm.amount,
        projectId: vm.project._id,
        giftAidAddress: vm.giftAidAddress,
        user: vm.user,
        type: 'BANK_TRANSFER'
      };
      return $http.post(API + 'sendDonation', payment).then(function (result) {
        console.log(result.data);
        NotificationService.success("Your donation request has been successfully saved");
        vm.setMode('BANK_TRANSFER_REQUESTED');
        vm.donation = result.data.donation;
        vm.donation.money = formatDonationMoney(vm.donation);
      }, function (failure) {
        console.log(failure);
        NotificationService.error("Unfortunately we cannot get bank details for this donation.");
      });
    };

    return vm;
  }]);
