angular.module('aliceApp')
	.controller('BoardController', ['NotificationService', '$scope', '$state', '$stateParams', '$http', 'DAI_ADDRESS', 'DAI_TARGET_ADDRESS', 'API', 'DAI_START_BLOCK', function (NotificationService, $scope, $state, $stateParams, $http, DAI_ADDRESS, DAI_TARGET_ADDRESS, API, DAI_START_BLOCK) {
		var vm = this;

		vm.donations = [];

		vm.isWeb3 = typeof web3 !== 'undefined';
		vm.total = 0;
		vm.count = 0;

		var startBlock = DAI_START_BLOCK;

		var showNetworkName = function () {
			return web3.version.getNetwork((err, netId) => {
				vm.networkId = netId;
				switch (netId) {
					case "1":
						return console.log("You are connected to the Main Ethereum network.");
					case "4":
						return console.log("You are connected to the Rinkeby test network.");
					case "42":
						return console.log("You are connected to the Kovan test network.");
					default:
						return console.log("You are connected to the unknown network.");
				}
			});
		};

		var setupDai = function () {
			var Dai = web3.eth.contract([
				{
					"anonymous": false,
					"inputs": [
						{
							"indexed": true,
							"name": "from",
							"type": "address"
						},
						{
							"indexed": true,
							"name": "to",
							"type": "address"
						},
						{
							"indexed": false,
							"name": "value",
							"type": "uint256"
						}
					],
					"name": "Transfer",
					"type": "event"
				}
			]);

			vm.dai = Dai.at(DAI_ADDRESS);

			console.log("Dai address: " + DAI_ADDRESS);
			console.log("Project address: " + DAI_TARGET_ADDRESS);
		};

		var getDonations = function () {
			console.log("Getting donations: " + startBlock);
			vm.dai.Transfer({to: DAI_TARGET_ADDRESS}, {fromBlock: startBlock, toBlock: 'latest'}).get((error, events) => {
				if (error)
					console.log('Error in myEvent event handler: ' + error);
				else {
					events.forEach(function (event) {
							console.log(event);
							var val = parseFloat(web3.fromWei(event.args.value, 'ether'));
							vm.donations.unshift({
								amount: val,
								tx: event.transactionHash,
							});
							vm.total = vm.total + val;
							vm.count++;
							startBlock = event.blockNumber + 1;
						});
						if (events.length>0) {
							$scope.$apply(function () {
							});
						}

					setTimeout(getDonations, 3000);
				}
			});

		};


		vm.loadWeb3 = function () {
			if (!web3.isConnected()) {
				NotificationService.error("Couldn't connect to the Ethereum network, make sure that your browser supports web3.");
			} else {
				showNetworkName();
				setupDai();
				getDonations();
			}
		};


		return vm;
	}])
;
