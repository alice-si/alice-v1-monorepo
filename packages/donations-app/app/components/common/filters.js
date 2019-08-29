angular.module('aliceApp')
  .filter('age', function () {
    function calculateAge(birthday) { // birthday is a date
      if (!birthday) return "";
      if (typeof birthday === 'string') birthday = new Date(birthday);
      var ageDifMs = Date.now() - birthday.getTime();
      var ageDate = new Date(ageDifMs); // miliseconds from epoch
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    return function (birthdate) {
      return calculateAge(birthdate);
    };
  })
  .filter('firstWord', function() {
		return function(data) {
			if(!data) return data;
			data = data.split(' ');
    		return data[0];
    	};
  })
  .filter('lastWord', function() {
		return function(data) {
			if(!data) return data;
			data = data.split(' ');
    		return data[data.length - 1];
    	};
  })
	.filter('keyToTitle', function() {
		const titles = {
			totalDonated : "You've donated",
			totalPaidOut : "Spent so far",
			goalsAchieved : "Lives Changed",
			remaining : "Awaiting Validation"
		};
		return function(data) {
			 return titles[data];
		};
	})
  .filter('money', ['numberFilter', function (numberFilter) {

    return function (val) {
      if (val === null || val === undefined) return '';
      val = val / 100;
      var isInteger = (val === parseInt(val, 10));
      return "£" + numberFilter(val, isInteger ? 0 : 2);
    };
  }])
  .filter('rounded', ['numberFilter', function (numberFilter) {
    return function (val) {
      if (val === null || val === undefined) return '';
      return "£" + numberFilter(val / 100, 0);
    };
  }])
	.filter('roundedK', ['numberFilter', function (numberFilter) {
    return function (val) {
      if (val === null || val === undefined) return '';
			val = val / 100;
			if(val < 10000) {
				var isInteger = (val === parseInt(val, 10));
        return "£" + numberFilter(val, isInteger ? 0 : 2);
      }
      return "£" + (Math.floor(val / 1000)) + 'k';
    };
  }])
	.filter('smallTitle', function() {
		return function(title) {
			if(title && title.length > 20) {
			 	return title.slice(0, 18) + '...';
			}
		};
	})
  .filter('booleanTick', function() {
    return function(input) {
      return input ? "\u2714" : "\u2716";
    };
  })
	.filter('vowelize', function() {
		return function(word) {
      const vowelRegex = '^[aieouAIEOU].*';
      if (!word) {
        return '';
      }
			if(word.match(vowelRegex)) {
				return 'An ' + word;
			}
			return 'A ' + word;
		}
	})
	.filter('pastTense', ['Tensify', function(Tensify) {
		return function(verb, current, target) {
			if(current === target) {
				return Tensify.tensify(verb).past;
			}
			else {
				return 'to ' + verb;
			}
		}
	}])
	.filter('capitalize', function () {
		return function(input) {
			if (input && (typeof input) == 'string' && input.length > 0) {
				return input.charAt(0).toUpperCase() + input.substr(1).toLowerCase();
			}
			return input;
		}
	});
