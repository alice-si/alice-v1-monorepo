angular.module('aliceApp')
  .controller('DonationProcessingController', ['$http', '$sce', '$scope', '$timeout', 'NotificationService', 'API', 'MANGO', 'CheckoutService', function ($http, $sce, $scope, $timeout, NotificationService, API, MANGO, CheckoutService) {

    var vm = this;

    vm.donation = CheckoutService.donation;

    vm.edit = function () {
      $scope.$dismiss();
      CheckoutService.showCheckout();
    };

    vm.donate = function () {
      vm.donating = true;
      ga('send', 'event', 'donation', 'confirmDonation', CheckoutService.project.code, CheckoutService.donation.amount / 100);
      CheckoutService.donate().then(function(response) {
        vm.donating = false;
        if (response.secureModeNeeded) {
          console.log(response.redirectUrl);
          vm.mode = '3DS';
          vm.secureModeUrl = $sce.trustAsResourceUrl(response.redirectUrl);
          checkDonationStatus(response.donation._id);
        } else {
          $scope.$dismiss();
          CheckoutService.showConfirmation();
        }
      }, function(err) {
        //Offer ability for another trial after an error
        vm.donating = false;
      });
    };

    var checkDonationStatus = function (donationId) {
      console.log("Checking donation status for: " + donationId);
      $http.get(API + 'checkDonationStatus/' + donationId).then(function (result) {
        var donation = result.data;
        if (donation.status == 'CREATED' || donation.status == 'BIG_TRANSFER_CREATED') {
          $scope.$dismiss();
          CheckoutService.showConfirmation();
        } else if (donation.status == 'FAILED') {
          NotificationService.error("Your bank verification was incorrect – please try again. If you keep getting this error, contact your credit card issuer to resolve the issue.");
          vm.mode = 'CARD';
        } else {
          $timeout(function () {
            checkDonationStatus(donationId);
          }, 1000);
        }
      });
    };

    //TODO: Logic for 3DS Iframe resizing (I'm not sure if it's needed any more but let's test on mobile)
    var rescale = function () {
      vm.iframeScale = Math.min(1, window.innerWidth / 500);
    };

    $(window).resize(function () {
      $scope.$apply(rescale);
    });

    rescale();

  }]);
