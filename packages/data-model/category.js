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

function schemaModifier(schema, mongooseInstance) {
  const Project = require('./project')(mongooseInstance);
  schema.pre('remove', function (next) {
    Project.find({_parentId: this._id}).remove(function () {
      console.log("Removing nested projects");
    });
    next();
  });
}

module.exports = ModelUtils.exportModel('Category', CategorySchema, schemaModifier);
