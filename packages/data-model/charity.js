const Mongoose = require('mongoose');
const htmlencode = require('htmlencode');
const ModelUtils = require('./model-utils');

let CharitySchema = new Mongoose.Schema({
  name: String,
  legalName: String,
  code: {type: String, unique: true},
  picture: String,
  description: String,
  projects: [{
    type: Mongoose.Schema.ObjectId,
    ref: 'Project'
  }],
  projectAdmins: [{
    type: Mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  projectManagers: [{
    type: Mongoose.Schema.ObjectId,
    ref: 'User'
  }]
});

CharitySchema.methods.prepareForSaving = function () {
  this.projects = undefined;
  this.description = htmlencode.htmlDecode(this.description);
};

CharitySchema.statics.addProjectToCharity = function(project, callback) {
  if (!project.charity) {
    throw "Saved project does not have charity field";
  } else {
    this.findById(project.charity).then(function(charity) {
      if (!charity.projects.includes(project._id)) {
        charity.projects.push(project._id);
      }
      charity.save(callback);
    }); 
  }
};

module.exports = ModelUtils.exportModel('Charity', CharitySchema);
