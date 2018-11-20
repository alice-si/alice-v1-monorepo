const Mongoose = require('mongoose');
const htmlencode = require('htmlencode');
const ModelUtils = require('./model-utils');

const projectStatuses = ['FINISHED', 'ACTIVE', 'CREATED'];
const processNames = ['PROJECT_DEPLOYMENT'];
const fieldsToDecode = ['lead', 'summary', 'project', 'serviceProvider', 'beneficiary', 'validator', 'costBreakdown', 'outcomesIntro'];

let projectSchemaObject = {
  code: {type: String, unique: true},
  title: String,
  status: {
    type: String,
    enum: ModelUtils.evaluateStatuses(processNames, projectStatuses),
    default: 'CREATED'
  },
  lead: String,
  charity: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Charity'
  },
  img: String,
  video: String,

  summary: String,
  project: String,
  serviceProvider: String,
  beneficiary: String,
  validator: String,
  initializerImg: String,
  validatorImg: String,
  validatorUrl: String,
  costBreakdown: String,

  upfrontPayment: Number,
  peopleTarget: Number,
  fundingTarget: Number,
  perPerson: Number,
  externalFunding: Number,
  outcomesIntro: String,
  contractAddress: String,

  mangoContractWalletId: String,
  mangoBeneficiaryWalletId: String,

  myStory: [{
    img: String,
    header: String,
    details: String
  }],
  _outcomes: [{
    type: Mongoose.Schema.ObjectId,
    ref: 'Outcome'
  }],
  _categoryId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Category'
  }
};

ModelUtils.addDateFields(processNames, projectSchemaObject);
ModelUtils.addTxFields(processNames, projectSchemaObject);

let ProjectSchema = new Mongoose.Schema(projectSchemaObject);

ProjectSchema.methods.htmlFieldsDecode = function () {
  let project = this;
  fieldsToDecode.forEach(function (field) {
    project[field] = htmlencode.htmlDecode(project[field]);
  });
  project.myStory.forEach(function (story) {
    story.header = htmlencode.htmlDecode(story.header);
    story.details = htmlencode.htmlDecode(story.details);
  });
};

module.exports = ModelUtils.exportModel('Project', ProjectSchema);
