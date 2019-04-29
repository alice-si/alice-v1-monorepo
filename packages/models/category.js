const Mongoose = require('mongoose');
const ModelUtils = require('./model-utils');

let CategorySchema = new Mongoose.Schema({
  title: String,
  lead: String,
  img: String,
  _projects: [{
    type: Mongoose.Schema.ObjectId,
    ref: 'Project'
  }]
});

module.exports = ModelUtils.exportModel('Category', CategorySchema);
