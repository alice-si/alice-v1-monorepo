angular.module('aliceApp')
  .controller('GeekModeController', ['AuthService', '$scope', '$http', 'ETHERSCAN', 'WEB3_NETWORK_ID', 'ETH_NETWORK_NAME', 'API', 'NotificationService', function (AuthService, $scope, $http, ETHERSCAN, WEB3_NETWORK_ID, ETH_NETWORK_NAME, API, NotificationService) {
    var vm = this;

    vm.ETHERSCAN = ETHERSCAN;
    vm.auth = AuthService;
    vm.balance = 0;
    vm.web3Status = {
      loaded: typeof web3 !== 'undefined',
      correctNetworkId: false
    };
    vm.ethNetworkName = ETH_NETWORK_NAME;
    vm.showCopiedNotification = function () {
      NotificationService.success('Copied to clipboard');
    };

    checkNetworkId();
    loadData();

    function loadData () {
      $http.get(API + 'getMyProjects').then(function (result) {
        checkBalance(result.data);
      });
    }

    function checkBalance (projects) {
      const account = AuthService.getLoggedUser().ethAccount;

      let MyContract = web3.eth.contract([{
        "constant": false,
        "inputs": [
          {
            "name": "_donorAddress",
            "type": "address"
          }
        ],
        "name": "getBalance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      }]);

      /* jshint ignore:start */
      for (let project of projects) {
        if (project.ethAddresses && project.ethAddresses.impact) {
          let myContractInstance = MyContract.at(project.ethAddresses.impact);
          myContractInstance.getBalance.call(account, function (err, result) {
            if (err) {
              console.error(err);
            }
            $scope.$apply(function () {
              vm.balance += result;
            });
          });
        }
      }
      /* jshint ignore:end */


      $http.get(API + 'getMyTransactions').then(function (result) {
        vm.donated = 0;
        vm.paid = 0;
        vm.donations = result.data.donations;
        vm.donations.forEach(function (donation) {
          vm.donated += donation.amount;
        });
        // hiding donations without depositingTx
        vm.donations = vm.donations.filter(donation => donation.depositingTx);
        vm.impacts = result.data.impacts;
        vm.impacts.forEach(function (impact) {
          vm.paid += impact.amount;
        });
      });
    }

    function checkNetworkId () {
      if (vm.web3Status.loaded) {
        web3.version.getNetwork(function (err, netId) {
          if (!err) {
            console.log(`Got network id: ${netId}`);
            $scope.$apply(function () {
              vm.web3Status.correctNetworkId = netId == WEB3_NETWORK_ID;
            });
          } else {
            console.error(err);
          }
        });
      }
    }

    return vm;
  }]);
