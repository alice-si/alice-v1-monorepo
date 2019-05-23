angular.module('aliceApp')
	.controller('DaiController', ['NotificationService', '$scope', '$state', '$stateParams', '$http', 'DAI_ADDRESS', 'DAI_TARGET_ADDRESS', 'API', function (NotificationService, $scope, $state, $stateParams, $http, DAI_ADDRESS, DAI_TARGET_ADDRESS, API) {
		var vm = this;

		vm.donation = {};

		vm.isWeb3 = typeof web3 !== 'undefined';

		var showNetworkName = function () {
			return web3.version.getNetwork((err, netId) => {
				vm.networkId = netId;
				switch (netId) {
					case "1":
						return NotificationService.success("You are connected to the Main Ethereum network.");
					case "4":
						return NotificationService.success("You are connected to the Rinkeby test network.");
					case "42":
						return NotificationService.success("You are connected to the Kovan test network.");
					default:
						return NotificationService.success("You are connected to the unknown network.");
				}
			});
		};

		var getEthereumAccount = function () {
			vm.ethAccount = web3.eth.defaultAccount;
			console.log("Your eth account: " + vm.ethAccount);
		};

		var setupDai = function () {
			var Dai = web3.eth.contract([
				{
					"constant": true,
					"inputs": [
						{
							"name": "_owner",
							"type": "address"
						}
					],
					"name": "balanceOf",
					"outputs": [
						{
							"name": "",
							"type": "uint256"
						}
					],
					"payable": false,
					"stateMutability": "view",
					"type": "function"
				},
				{
					"constant": false,
					"inputs": [
						{
							"name": "_to",
							"type": "address"
						},
						{
							"name": "_value",
							"type": "uint256"
						}
					],
					"name": "transfer",
					"outputs": [
						{
							"name": "",
							"type": "bool"
						}
					],
					"payable": false,
					"stateMutability": "nonpayable",
					"type": "function"
				}
			]);

			vm.dai = Dai.at(DAI_ADDRESS);
		};

		var checkDaiBalance = function () {
			vm.dai.balanceOf(vm.ethAccount, function (err, result) {
				console.log(result);
				if (err) console.log(err);
				$scope.$apply(function () {
					vm.balance = web3.fromWei(result, 'ether');
					vm.donation.amount = parseFloat(vm.balance);
					console.log("Your dai balance: " + vm.balance);
				});
			});
		};

		var transferDai = function (socialProject, value) {
			return new Promise(function (resolve, reject) {
				vm.dai.transfer(DAI_TARGET_ADDRESS, value, {from: vm.ethAccount}, function (err, result) {
					if (err) return reject(err);
					return resolve(result);
				});
			});
		};

		var fetchProjectAddress = function() {
			return $http.get(API + 'projects/' + projectCode).then(function(result) {
				console.log(result);
				vm.target = result;
			});
		};

		vm.donate = function () {
			transferDai(vm.projectAddress, web3.toWei(vm.donation.amount, "ether")).then(function (result) {
				console.log(result);
				$state.go('dai-thankyou', {
					donationAmount: vm.donation.amount,
					donationTx: result
				});
			}).catch(function (err) {
				NotificationService.error("Error while processing transaction: " + err);
			});

		};

		vm.loadWeb3 = function () {
			if (!web3.isConnected()) {
				NotificationService.error("Couldn't connect to the Ethereum network, make sure that your browser supports web3.");
			} else {
				showNetworkName();
				getEthereumAccount();
				setupDai();
				checkDaiBalance();
			}
		};


		return vm;
	}])
;
