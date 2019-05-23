angular.module('aliceApp')
	.controller('DaiThankYouController', ['NotificationService','$http', '$state', '$stateParams', 'API', function (NotificationService, $http, $state, $stateParams, API) {
		var vm = this;
		vm.user = {};

		vm.donationAmount = $stateParams.donationAmount;

		vm.goToAnimals = function() {
			$state.go('project', { projectCode: 'save-from-abuse' });
		};

		this.registerEmail = function () {
			return $http.post(API + 'registerDaiDonor', {
				user: vm.user,
				donation: $state.params
			}).then(function(result) {
				NotificationService.success(result.data.msg);
			});
		};

		vm.getEthereumAccount = function () {
			vm.user.daiAccount = web3.eth.defaultAccount;
		};

		return vm;
	}]);
