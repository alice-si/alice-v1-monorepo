angular.module('aliceApp')
  .directive('icheck', ['$timeout', function ($timeout) {
    return {
      require: 'ngModel',
      link: function ($scope, element, $attrs, ngModel) {
        return $timeout(function () {
          var value = $attrs.value;
          $scope.$watch($attrs.ngModel, function (newValue) {
            $(element).iCheck('update');
          });

          $scope.$watch($attrs.ngDisabled, function (newValue) {
            $(element).iCheck(newValue ? 'disable' : 'enable');
            $(element).iCheck('update');
          });

          return $(element).iCheck({
            checkboxClass: 'icheckbox_minimal-blue',
            radioClass: 'iradio_minimal-blue'
          }).on('ifToggled', function (event) {
            if ($(element).attr('type') === 'checkbox' && $attrs.ngModel) {
              $scope.$apply(function () {
                return ngModel.$setViewValue(event.target.checked);
              });
            }
            if ($(element).attr('type') === 'radio' && $attrs.ngModel) {
              return $scope.$apply(function () {
                return ngModel.$setViewValue(value);
              });
            }
          });
        });
      }
    };
  }])
  .directive('hasError', [function () {
    return {
      require: '^form',
      restrict: "A",
      link: function (scope, element, attrs, ctrl) {
        var input = element.find('input, textarea, select');
        if(input && input.length) {
          scope.$watch(function () {
            return (ctrl.$submitted || input.controller('ngModel').$touched) && input.controller('ngModel').$invalid;
          }, function (isInvalid) {
            element.toggleClass('has-error', isInvalid);
          });
        }
      }
    };
  }])
  .directive('errorMessage', [function () {
    return {
      require: '^form',
      restrict: 'E',
      transclude: true,
      scope: {},
      template: '<span ng-show="(formCtrl.$submitted || inputCtrl.$touched) && inputCtrl.$error[error]" class="help-block" ng-transclude></span>',
      link: function ($scope, element, attrs, ctrl) {
        $scope.formCtrl = ctrl;
        $scope.inputCtrl = ctrl[attrs.name];
        $scope.error = attrs.error;
      }
    };
  }])
  .directive('pwCheck', [function () {
    return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
        var me = attrs.ngModel;
        var matchTo = attrs.pwCheck;

        scope.$watch('[' + me + ', ' + matchTo + ']', function (value) {
          ctrl.$setValidity('pwmatch', value[0] === value[1]);
        });
      }
    };
  }])
  .directive('validateUser', [function () {
    return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
        var input = attrs.ngModel;
        var selected = attrs.validateUser;

        scope.$watch('[' + input + ', ' + selected + ']', function (value) {
          console.log("INPUT: " + value[0]);
          console.log("SELECTED: " + value[1]);
          if (value[0] && value[1] === undefined) {
            ctrl.$setValidity('missingUser', false);
          } else {
            ctrl.$setValidity('missingUser', true);
          }

        });
      }
    };
  }])
  .directive('userSearch', function () {
    return {
      scope: {
        model: '=',
        onSelect: '&'
      },
      /*jshint multistr: true */
      template: '<input type="text" id="screeningInput" class="form-control screening"\
                  ng-model="ctrl.model"\
                  typeahead-on-select="ctrl.onSelect({item : $item})"\
                  placeholder="Type in name to start screening..."\
                  ng-keypress="ctrl.onKeyPress($event)"\
                  uib-typeahead="user.fullName for user in ctrl.findUsers($viewValue)">',
      controller: ['SearchService', 'UserService', function (SearchService, UserService) {
        this.findUsers = SearchService.findUsers;

        this.onKeyPress = function (keyEvent) {
          if (keyEvent.which === 13) {
            UserService.openInvitationModal(this.model);
          }
        };
      }],
      controllerAs: 'ctrl',
      bindToController: true
    };
  })
  .directive('under18', function () {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, elm, attrs, ctrl) {
        ctrl.$parsers.unshift(function (value) {
          if (value && moment(value)) {
            var years = moment().diff(moment(value), 'years');
            ctrl.$setValidity('under18', years >= 18);
          }
          return value;
        });
      }
    };
  })
  .directive('nonAmex', ['$timeout', function ($timeout) {
    return {
      restrict: 'A',
      require: ['ngModel', 'ccNumber'],
      link: function ($scope, elm, attrs, ctrls) {
        var ngModelCtrl = ctrls[0];
        var ccNumber = ctrls[1];
        $scope.$watch(attrs.ngModel, function (number) {
          $timeout(function () {
            ngModelCtrl.$setValidity('nonAmex', ccNumber.type != "American Express");
          });
        });
      }
    };
  }])
  .directive('complexPassword', function () {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, elm, attrs, ctrl) {
        ctrl.$parsers.unshift(function (value) {
          ctrl.$setValidity('upperCase', (/[A-Z]/.test(value)));
          ctrl.$setValidity('digit', (/\d/.test(value)));
          return value;
        });
      }
    };
  })
  .directive('futureDate', [function () {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, elm, attrs, ctrl) {
        ctrl.$parsers.unshift(function (value) {
          var date = moment(value, 'MM/YY').endOf('month');
          ctrl.$setValidity('futureDate', date.isAfter(moment()));
          return value;
        });
      }
    };
  }])
  .directive('money00', function () {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, elm, attrs, ctrl) {
        ctrl.$parsers.unshift(function (value) {
          return value * 100;
        });

        ctrl.$formatters.unshift(function (value) {
          return value / 100;
        });
      }
    };
  })
  .directive('twitter', [
    function () {
      return {
        link: function (scope, element, attr) {
          setTimeout(function () {
            twttr.widgets.createShareButton(
              attr.url,
              element[0],
              function (el) {
              }, {
                count: 'none',
                text: attr.text,
                size: "large"
              }
            );
          });
        }
      };
    }
  ])
  .directive('sort', function () {

    return {
      scope: {
        action: '=',
        field: '@'
      },
      /*jshint multistr: true */
      template: '<span style="position: relative; margin-left: 2px;">\
                   <i class="fa fa-chevron-up" aria-hidden="true" style="position: absolute; top: -1px; font-size: 10px; color: #1998a2; cursor: pointer;" ng-click="action(field, \'ASC\')"></i>\
                   <i class="fa fa-chevron-down" aria-hidden="true" style="position: absolute; font-size: 10px; color: #1998a2; top: 6px; cursor: pointer;" ng-click="action(\'-\' + field, \'ASC\')"></i>\
                 </span>'
    };
  })
  .directive('s3loader', ['$http', 'API', function ($http, API) {
    function updateStatus(status, scope) {
      const s3ResUrl = 'https://s3.eu-west-2.amazonaws.com/alice-res/';
      const statusInfo = {
        undefined: {},
        signing: {
          description: 'Signing request for s3',
          statusIconUrl: s3ResUrl + 'loader-spinner.gif'
        },
        sending: {
          description: 'Sending file to aws s3',
          statusIconUrl: s3ResUrl + 'loader-bar.gif'
        },
        sent: {
          description: 'Image was sent',
          statusIconUrl: s3ResUrl + 'ok-icon.png'
        }
      };

      scope.description = statusInfo[status].description;
      scope.statusIconUrl = statusInfo[status].statusIconUrl;
      scope.status = status;
    }
    return {
      restrict: 'A',
      scope: {
        model: "="
      },
      link: function (scope) {
        updateStatus('undefined', scope);

        var sendToAWS = function (img) {
          return new Promise(function (resolve, reject) {
            var filename = Date.now() + "_" + img.name;
            updateStatus('signing', scope);
            $http.get(API + 'getAWSPostData/' + filename).then(function (result) {
              var postData = result.data.postData;

              var formData = new FormData(result.data.postData);
              for (var key in postData) {
                formData.append(key, postData[key]);
              }
              formData.append('file', img);
              var options = {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined, Authorization: undefined}
              };
              updateStatus('sending', scope);
              $http.post(result.data.url, formData, options).then(function (response) {
                updateStatus('sent', scope);
                resolve(result.data.link);
              }, function (err) {
                reject(err);
              });
            });
          });
        };

        scope.$watch('imgFileModel', function () {
          if (scope.imgFileModel) {
            sendToAWS(scope.imgFileModel).then(function (link) {
              scope.$apply(function () {
                scope.model = link;
              });
            });
          }
        });

      },
      /*jshint multistr: true */
      template: '<div >\
                  <div class="btn btn-sm btn-primary"\
                      style="height:34px; padding-top:7px; margin-top: 3px; text-align:center; width:10vw" ngf-select\
                      ngf-pattern="\'image/*\'"\
                      ngf-accept="\'*\'" ngf-max-size="20MB" ngf-min-height="100"\
                      ng-model="imgFileModel">\
                    Browse\
                  </div>\
                   <span ng-if="status != \'undefined\'">\
                    <img style="width:80px; margin-left: 10px;" src="{{statusIconUrl}}">\
                    {{description}}\
                   </span>\
                </div>\
                <div style="text-align: center; margin-top:10px" class="col-md-12">\
                <img src="{{model}}" style="max-width:300px; box-shadow: 1px 1px 1px #888888">\
                </div>'
    };
  }])
  .directive('userList', ['$http', 'API', function ($http, API) {
    return {
      restrict: 'A',
      scope: {
        model: "=",
        maxTags: "@",
        minTags: "@",
      },
      link: function (scope) {
        scope.modelLoaded = false;
        scope.$watch('model', function () {
          if (!scope.modelLoaded && scope.model && scope.model.length > 0) {
            scope.modelLoaded = true;
            $http.post(API + 'getUsersData', scope.model).then(function (users) {
              scope.userList = users.data;
            });
          }
        });

        scope.searchUser = function (query) {
          if (!query) {
            return {data: []};
          } else {
            return $http.get(API + 'userSearch/' + query);
          }
        };

        scope.addUser = function (user) {
          if (scope.model) {
            scope.model.push(user._id);
          } else {
            scope.model = [user._id];
          }
        };

        scope.removeUser = function (user) {
          if (scope.model) {
            scope.model = scope.model.reduce((acc, cur) => {
                if (cur != user._id
                ) {
                  acc.push(cur);
                }
                return acc;
              },
              []
            );
          }
        };
      },
      /*jshint multistr: true */
      template: '<tags-input ng-model="userList" min-tags="{{minTags}}" max-tags="{{maxTags}}" display-property="details" add-from-autocomplete-only="true"\
                 on-tag-added="addUser($tag)" on-tag-removed="removeUser($tag)" placeholder="Start typing an email address...">\
                    <auto-complete min-length="2" source="searchUser($query)"></auto-complete>\
                </tags-input>'
    };
  }])
  .directive('loadingScreen', function () {
    return {
      templateUrl: '/components/global/loader.html',
    };
  });
