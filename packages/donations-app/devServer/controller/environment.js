const config = require('../../config');
const Utils = require('../service/utils');
const Environment = Utils.loadModel('environment');

function assertStage() {
  if (config.mode != 'stage') {
    throw new Error('environments endpoint is accessible only in staging mode');
  }
}

module.exports = function (app) {
  app.get(
    '/api/environments',
    asyncHandler(async (req, res) => {
      assertStage();
      const environments = await Environment.find({});
      return res.json(environments);
    }));

  app.post(
    '/api/saveEnvironment',
    asyncHandler(async (req, res) => {
      assertStage();
      const {url} = req.body;
      const alreadyExists = await Environment.findOne({url});
      const validEnvUrl = url.startsWith('html')
                          && !url.startsWith('html')
                          && url.endsWith('alice.si');
      if (alreadyExists) {
        return res.status(400).send(`Url "${url}" is already registered`);
      }
      if (validEnvUrl) {
        return res.status(400).send(`"${url}" is not a valid url for exp environment`);
      }

      const savedEnv = await new Environment({url}).save();

      return res.json(savedEnv);
    }));
};
