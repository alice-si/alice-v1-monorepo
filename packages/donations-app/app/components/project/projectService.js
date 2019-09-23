angular.module('aliceApp')
  .service('ProjectService', ['$http', 'API', 'HOST', function ($http, API, HOST) {

    var model = {};

    this.getCategories = function () {
      return $http.get(API + 'getCategories');
    };

    // Deprectated - TODO remove later
		// this.getActiveProjects = function () {
		// 	return $http.get(API + 'getActiveProjects');
    // };

    this.getProjects = function () {
      return $http.get(API + 'getProjects');
    }
    
    this.saveProject = function (project) {
      return $http.post(API + 'saveProject', project);
    };

    this.saveProjectWithOutcomes = function (project) {
      return $http.post(API + 'saveProjectWithOutcomes', project);
    };

    this.saveOutcome = function (outcome) {
      return $http.post(API + 'saveOutcome', {outcome: outcome});
    };

    this.removeProject = function (project) {
      return $http.post(API + 'removeProject', project);
    };

    this.removeOutcome = function (outcome) {
      return $http.post(API + 'removeOutcome', outcome);
    };

    this.getPilotProject = function () {
      return $http.get(API + 'getPilotProject');
    };

    // this.getProject = function(projectCode) {
    //   var ret = {};
    //   var filter = function() {
    //     angular.extend(ret, _.chain(model.categories)
    //       .pluck('_campaigns')
    //       .flatten()
    //       .where({code: projectCode})
    //       .first().value()
    //     );
    //   };
    //   $rootScope.$on('model:update', function() {
    //     filter();
    //   });
    //   filter();
    //   return ret;
    // };

    this.getSupporters = function (projectId) {
      return $http.get(API + 'getSupporters/' + projectId);
    };

    this.getProjectDetails = function (projectCode) {
      return $http.get(API + 'projects/' + projectCode);
    };

    this.prepareProjectDetails = function (details) {
      details.percentage = (details.raised / details.fundingTarget) * 100;

      // details.raised is in pence, details.perPerson is in pounds
      details.peopleFunded = Math.round(details.amountValidated/ details.perPerson);
      details.host = HOST;

      return details;
    };

    this.model = model;

  }]);
