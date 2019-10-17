angular.module('aliceApp')
.directive('outcomeCard', ['$uibModal', function ($uibModal) {
  return {
    scope: {
      projectUnit: '=',
      outcome: '=',
      index: '=',
      showClaimingForm: '=',
    },
    link: function (scope) {
      scope.claimFn = function (outcome, quantity) {
        $uibModal.open({
          templateUrl: '/components/global/claimModal.html',
          controller: 'ImpactClaimController as claimCtrl',
          resolve: {
            outcome: () => outcome,
            quantity: () => quantity,
          }
        });
      };
    },
    templateUrl: '/components/global/outcomeCard.html'
  };
}]).directive('outcomeCards', ['$http', 'API', function ($http, API) {
  return {
    scope: {
      project: '=',
      showImpact: '=',
      showClaimingForm: '=',
    },
    link: function (scope, elm, attrs, ctrls) {
      scope.$watch('project', function (projectCode) {
        loadOutcomes(projectCode);
      });

      // FIXME - we should modify data in DB, so StMungos will be
      // displayed correctly without this hack
      function doHackForStMungos(outcomes) {       
        let hiddenOutcomes = [
          'KEEP A PERMANENT HOME (6 months)',
          'KEEP A TEMPORARY HOME (6 months)',
          'KEEP A PERMANENT HOME',
          'KEEP A PERMANENT HOME (6 months)',
          'Tackle substance misuse: register with a specialist  they trust to get the help they need',
          'CONNECT TO SERVICES OUTSIDE LONDON'
        ];
        let helped = {
          '57d7e78504efabbc43d4f8b9': 3,
          // '57d7e8b404efabbc43d4f8ba': 1,
          '58d902fdfc008d7f9aabd43c': 1,
          '57d7ea4d04efabbc43d4f8bb': 3,
          '58d9041ffc008d7f9aabd43f': 2,
          '58d904e7fc008d7f9aabd441': 3,
          '58d905bffc008d7f9aabd442': 3
        };
        let newOutcomes = [];
        for (let outcome of outcomes) {
          if (!hiddenOutcomes.includes(outcome.title)) {
            outcome.value = outcome.title;
            outcome.unit = 'person';
            outcome.helped = helped[outcome._id];
            outcome.quantityOfUnits = 15;
            newOutcomes.push(outcome);
          }
        }

        return newOutcomes;
      }

      function loadImpact(projectCode) {
        $http.get(API + `getImpactForOutcomes/${projectCode}`)
          .then(function (result) {
            let moneyImpact = result.data;
            scope.outcomes.forEach(outcome => {
              if (moneyImpact[outcome._id]) {
                outcome.helpedWithUserDonations = moneyImpact[outcome._id].helped;
                outcome.userDonationsUsedAmount = moneyImpact[outcome._id].moneyUsed;
              }
            });
          });
      }

      function loadOutcomes(projectCode) {
        if (projectCode) {
          $http.get(API + `getOutcomes/${projectCode}`).then(function (result) {
            let {outcomes, projectUnit} = result.data;
            // FIXME - modify StMungo data in DB
            if (projectCode == 'mungos-15-lives') {
              outcomes = doHackForStMungos(outcomes);
            }
            scope.outcomes = outcomes;
            scope.projectUnit = projectUnit;

            if (scope.showImpact) {
              loadImpact(projectCode);
            }
          });
        }
      }      
    },
    template: `<div class="row">
                <outcome-card
                  project-unit="projectUnit"  
                  show-claiming-form="showClaimingForm"
                  ng-repeat="outcome in outcomes"
                  outcome="outcome"
                  index="$index">
                </outcome-card>
              </div>`
  };
}])
.directive('storyCard', function () {
  return {
    scope: {
      story: '=',
    },
    templateUrl: '/components/global/storyCard.html'
  };
})
.directive('storyCards', function () {
  return {
    scope: {
      stories: '=',
    },
    template: `<div class="row">
                <story-card
                  ng-repeat="story in stories"
                  story="story">
                </story-card>
              </div>`
  }
})
.directive('projectCard', function () {
  return {
    scope: {
      link: '=',
      project: '=',
    },
    templateUrl: '/components/global/projectCard.html',
  };
});
