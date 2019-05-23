const Auth = require('../service/auth');
const Utils = require('../service/utils');
const Mail = Utils.loadModel('mail');
const Category = Utils.loadModel('category');
const Aws = require('../service/aws');
const asyncHandler = require('express-async-handler');

module.exports = function (app) {
  app.post('/api/contact', asyncHandler(async (req, res) => {
    await Mail.sendContactMessage(req.body);
    return res.send('Message has been sent.');
  }));

  app.get(
    '/api/getAWSPostData/:filename',
    Auth.auth(),
    (req, res) => {
      const filename = req.params.filename;
      const result = Aws.evaluateAuthenticationData(filename);
      return res.json(result);
    });

  app.get('/api/getCategories', asyncHandler(async (req, res) => {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "_categoryId",
          as: "projects"
        }
      },
      {$project: {"projects.code": true, "img": true, "title": true}}
    ]);
    return res.json(categories);
  }));
};