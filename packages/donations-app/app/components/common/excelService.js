angular.module('aliceApp')
  .service('Excel', function () {
    return {
      tableToExcel: function (tableId, worksheetName, fileName) {
        let table = document.getElementById(tableId);
        let wb = XLSX.utils.table_to_book(table, {sheet: worksheetName});
        return XLSX.writeFile(wb, fileName);
      }
    };
  });