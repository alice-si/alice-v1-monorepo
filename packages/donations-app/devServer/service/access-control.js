const { includesObjectId } = require('./utils');

let AccessControl = {};

function hasValidatorAccess(user, projectId) {
  return (user.validator && includesObjectId(user.validator, projectId))
    || isSuperadmin(user);
}

function hasManagerAccess(user, projectId) {
  let accessibleProjects = user.managerAccess.concat(user.charityAdminAccess);
  return includesObjectId(accessibleProjects, projectId) || isSuperadmin(user);
}

function hasAdminAccess(user, projectId) {
  let hasAccessToProjectCreation = !projectId && user.charityAdmin;
  let accessibleProjects = user.adminAccess.concat(user.charityAdminAccess);

  return includesObjectId(accessibleProjects, projectId)
    || isSuperadmin(user)
    || hasAccessToProjectCreation;
}

function hasAdminAccessByCode(user, projectCode) {
  let accessibleProjectCodes =
    user.adminAccessCodes.concat(user.charityAdminAccessCodes);

  return accessibleProjectCodes.includes(projectCode)
    || isSuperadmin(user);
}

function hasCharityAdminAccess(user, charityId) {
  return (user.charityAdmin && user.charityAdmin.equals(charityId))
    || isSuperadmin(user);
}

function hasCharityAdminAccessByCode(user, charityCode) {
  return (user.charityForCharityAdmin && user.charityForCharityAdmin.code == charityCode)
    || isSuperadmin(user);
}

function hasSomeCharityAdminAccess(user) {
  return user.charityAdmin || isSuperadmin(user);
}

function hasAccessToUserDetails(user, targetUserId) {
  return (user._id.equals(targetUserId)) || isSuperadmin(user);
}

function isSuperadmin(user) {
  return user.superadmin;
}

Object.assign(AccessControl, {
  hasValidatorAccess,
  hasCharityAdminAccess,
  hasSomeCharityAdminAccess,
  isSuperadmin,
});

AccessControl.Middleware = {
  hasValidatorAccess: idGetter => checkAccess(hasValidatorAccess, idGetter),
  hasManagerAccess: idGetter => checkAccess(hasManagerAccess, idGetter),
  hasAdminAccess: idGetter => checkAccess(hasAdminAccess, idGetter),
  hasAdminAccessByCode:
    codeGetter => checkAccess(hasAdminAccessByCode, codeGetter),
  hasCharityAdminAccess:
    idGetter => checkAccess(hasCharityAdminAccess, idGetter),
  hasCharityAdminAccessByCode:
    codeGetter => checkAccess(hasCharityAdminAccessByCode, codeGetter),
  hasSomeCharityAdminAccess: checkAccess(hasSomeCharityAdminAccess),
  hasAccessToUserDetails:
    idGetter => checkAccess(hasAccessToUserDetails, idGetter),
  isSuperadmin: checkAccess(isSuperadmin),
};

function checkAccess(accessChecker, idGetter = (_req => null)) {
  return (req, res, next) => {
    function forbidden() {
      res.status(403).send('Forbidden');
    }

    if (req && req.user) {
      let id;
      try {
        id = idGetter(req);
      } catch (err) {
        console.error('Unhandled exception from id getter:\n' + err.stack);
        return forbidden();
      }

      if (accessChecker(req.user, id)) {
        next();
      } else forbidden();
    }
  };
}

module.exports = AccessControl;
