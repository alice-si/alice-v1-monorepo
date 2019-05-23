angular.module('aliceApp')
  .controller('UsersController', ['$http', 'API', 'AuthService', 'Excel', function ($http, API, AuthService, Excel) {
    let vm = this;
    vm.auth = AuthService;

    vm.users = [];
    vm.userSearch = '';
    vm.sortField = '-createdAt';
    vm.onlyAgreeContact = false;

    // This field is updated dynamically.
    vm.usersToDisplay = [];

    $http.get(API + 'getAllUsers').then(res => {
      vm.users = res.data;
      updateUsersToDisplay();
    });

    vm.sort = (field) => {
      vm.sortField = field;
    };
    vm.exportToExcel = () => {
      Excel.tableToExcel('users', 'users', 'users.xlsx');
    };

    function updateUsersToDisplay() {
      if (vm.onlyAgreeContact) {
        vm.usersToDisplay = vm.users.filter(user => user.agreeContact);
      } else {
        vm.usersToDisplay = vm.users;
      }
    }
    vm.updateUsersToDisplay = updateUsersToDisplay;

    return vm;
  }]);
