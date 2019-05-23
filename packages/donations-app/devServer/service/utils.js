const {promisify} = require('util');
const {readFile} = require('fs');
const Crypto = require('crypto');

const {htmlDecode} = require('htmlencode');
const Mongoose = require('mongoose');

const Config = require('../../config');

const Donation = loadModel('donation');
const Project = loadModel('project');
const User = loadModel('user');
const Validation = loadModel('validation');

function Utils() {
}

function loadModel(name) {
  return require('@alice-si/models/' + name)(Mongoose);
}

Utils.loadModel = loadModel;

Utils.getUserDetailsById = async (userId) => {
  let users = await User.aggregate([
    {$match: {'_id': Mongoose.Types.ObjectId(userId)}},
    lookupCharityProjects(
      {$in: ['$$userId', '$projectManagers']}, 'managerAccess'),
    lookupCharityProjects(
      {$in: ['$$userId', '$projectAdmins']}, 'adminAccess'),
    lookupCharityProjects(
      {$eq: ['$$adminForCharity', '$_id']}, 'charityAdminAccess'),
    {
      $lookup: {
        from: 'charities',
        localField: 'charityAdmin',
        foreignField: '_id',
        as: 'charityForCharityAdmin'
      }
    },
    {
      $unwind: {
        path: '$charityForCharityAdmin',
        preserveNullAndEmptyArrays: true
      }
    }
  ]);

  let numberOfUsers = users ? users.length : 0;
  if (numberOfUsers !== 1) {
    throw new Error(
      `Expected one user with id ${userId}, but found ${numberOfUsers}`);
  }

  return await addProjectCodesToUserDetails(users[0]);

  function lookupCharityProjects(condition, fieldName) {
    return {
      $lookup: {
        from: 'charities',
        let: {userId: '$_id', adminForCharity: '$charityAdmin'},
        pipeline: [
          {$match: {$expr: condition}},
          {$group: {_id: null, projectsArr: {$push: '$projects'}}},
          {
            $addFields: {
              projects: {
                $reduce: {
                  input: '$projectsArr',
                  initialValue: [],
                  in: {$concatArrays: ['$$value', '$$this']}
                }
              }
            }
          },
          {$project: {_id: false, projects: true}}
        ],
        as: fieldName
      }
    };
  }
};

// Looks up all references to projects by id and augments them with codes.
async function addProjectCodesToUserDetails(user) {
  let allProjectIds = new Set();

  let fieldsToCheck =
    ['managerAccess', 'adminAccess', 'charityAdminAccess', 'validator'];

  // Temporarily transform user.validator into the same format as the fields
  // returned from the aggregation.
  user.validator = [{projects: user.validator}];
  for (let field of fieldsToCheck) {
    if (user[field] && user[field].length === 1) {
      user[field] = user[field][0].projects;
    } else {
      user[field] = [];
    }

    // We use a Set here to make the array elements unique,
    // which they currently aren't because of a bug in our DB.
    let curProjectIds = new Set();
    for (let projectId of user[field]) {
      allProjectIds.add(projectId);
      curProjectIds.add(projectId);
    }
    user[field] = [...curProjectIds];
  }

  let projects = await Project.find({_id: {$in: [...allProjectIds]}}, 'code');
  let codeMap = {};
  for (let project of projects) {
    codeMap[project._id.toString()] = project.code;
  }

  for (let field of fieldsToCheck) {
    if (!user[field]) continue;

    let codes = [];
    for (let projectId of user[field]) {
      codes.push(codeMap[projectId.toString()]);
    }
    user[field + 'Codes'] = codes;
  }

  return user;
}

Utils.prepareIdList = function (list) {
  return list.map(id => Mongoose.Types.ObjectId(id));
};

Utils.createProjection = function (fields) {
  var reducer = function (acc, cur) {
    acc[cur] = true;
    return acc;
  };
  var projectionValue = fields.reduce(reducer, {"_id": false});
  var res = {$project: projectionValue};
  return res;
};

Utils.upsertEntityAsync = async function (obj, Model, constructor) {
  const entity = constructor(obj);
  return await Model.findByIdAndUpdate(
      entity._id,
      entity,
      {
        upsert: true,
        new: true
      }
    );
};

// this function assumes that each object has _id field
Utils.compareObjects = function (newObjects, oldObjects) {
  var compareResult = {toAdd: [], toRemove: []};
  var oldObjectsMap = Utils.createMapFromObjectsArray(oldObjects, "_id");
  var newObjectsMap = Utils.createMapFromObjectsArray(newObjects, "_id");

  newObjects.forEach(function (cur) {
    var diff = Utils.compareObjectWithOldObjects(cur, oldObjectsMap);
    if (diff) {
      compareResult.toAdd.push(diff);
    }
  });
  oldObjects.forEach(function (cur) {
    if (!newObjectsMap[cur._id]) {
      compareResult.toRemove.push(cur);
    }
  });

  return compareResult;
};

Utils.createMapFromObjectsArray = function (objects, keyField = "_id") {
  return objects.reduce((acc, cur) => {
      acc[cur[keyField]] = cur;
      return acc;
    },
    {}
  );
};

Utils.compareObjectWithOldObjects = function (newObj, oldObjectsMap) {
  var oldObj = oldObjectsMap[newObj._id];
  if (oldObj) {
    var diff = Utils.getDiff(newObj, oldObj);
    if (Object.keys(diff).length > 0) {
      diff._id = newObj._id;
      return diff;
    } else {
      return null;
    }
  } else {
    return newObj;
  }
};

// This function returns object which contains fields from new object
// that are not equal (or don't exist) to that fields in old object
Utils.getDiff = function (newObj, oldObj) {
  var preparator = function (val) {
    return htmlDecode(JSON.stringify(val));
  };
  var diff = {};
  for (var key in newObj) {
    if (preparator(newObj[key]) != preparator(oldObj[key])) {
      diff[key] = newObj[key];
    }
  }

  return diff;
};

// Calculates the total amount of claims for the project,
// regardless of whether they are approved.
Utils.getAmountClaimedForProject = async project => {
  let validations = await Validation.aggregate([
    {
      $match: { _projectId: project._id },
    },
    {
      $group: { _id: null, total: {$sum: '$amount'} }
    }
  ]);

  return validations.length > 0 ? validations[0].total : 0;
};

// Calculates the total amount of approved claims (validations).
// This is the amount that has been (or will shortly be)
// transferred to the beneficiary.
Utils.getAmountValidatedForProject = async project => {
  let validations = await Validation.aggregate([
    {
      $match: {
        $and: [
          { _projectId: project._id },
          {status: { $not: /CREATED|CLAIMING_/ }}
        ]
      }
    },
    {
      $group: { _id: null, total: {$sum: '$amount'} }
    }
  ]);

  return validations.length > 0 ? validations[0].total : 0;
};

// Calculates the total amount of successful donations for the project.
Utils.getAmountDonatedForProject = async project => {
  let donations = await Donation.aggregate([
    {
      $match: {
        $and: [{ _projectId: project._id }, { status: 'DONATED' }]
      }
    },
    {
      $group: { _id: null, total: { $sum: '$amount' } }
    }
  ]);

  return donations.length > 0 ? donations[0].total : 0;
};

// Returns the total amount collected from donations minus
// the amount that has already been transferred to the beneficiary
// after validation.
Utils.getAmountAvailableForProject = async project => {
  return await Utils.getAmountDonatedForProject(project)
       - await Utils.getAmountValidatedForProject(project);
};

Utils.bulkHasOperations = function (bulk) {
  return bulk && bulk.s && bulk.s.currentBatch && bulk.s.currentBatch.operations && bulk.s.currentBatch.operations.length > 0;
};

Utils.error = {
  toString: function (err) {
    if (err.constructor.name == 'Object') {
      return JSON.stringify(err);
    } else {
      return err.toString();
    }
  }
};

Utils.crypto = {
  encrypt: async function (msg) {
    let readFileAsync = promisify(readFile);
    const pub = await readFileAsync(Config.pathToKeys + 'alice.pub');
    return Crypto.publicEncrypt(pub, Buffer.from(msg)).toString('base64');
  }
};

Utils.includesObjectId = function (arr, id) {
  return arr.reduce(
    (acc, cur) => acc || Mongoose.Types.ObjectId(id).equals(cur),
    false);
};

module.exports = Utils;
