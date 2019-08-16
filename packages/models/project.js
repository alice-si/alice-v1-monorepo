const Mongoose = require('mongoose');
const htmlencode = require('htmlencode');
const ModelUtils = require('./model-utils');

const projectStatuses = ['FINISHED', 'ACTIVE', 'CREATED', 'PROTOTYPE'];
const processNames = ['PROJECT_DEPLOYMENT'];
const fieldsToDecode = ['lead', 'summary', 'project', 'serviceProvider', 'beneficiary', 'validator', 'costBreakdown', 'outcomesIntro'];

let projectSchemaObject = {
  code: {type: String, unique: true},
  title: String,
  status: {
    type: String,
    enum: ModelUtils.evaluateStatuses(processNames, projectStatuses),
    default: 'PROTOTYPE'
  },
  lead: String,
  charity: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Charity'
  },
  img: String,
  video: String,

  summary: String,
  extendedSummary: String,
  project: String,
  serviceProvider: String,
  beneficiary: String,
  typeOfBeneficiary: String,
  validator: String,
  initializerImg: String,
  validatorImg: String,
  validatorWhiteImg: String, // Should be removed later (used in appeal v2)
  validatorUrl: String,
  costBreakdown: String,
  location: String,

  upfrontPayment: Number,
  peopleTarget: Number,
  fundingTarget: Number,
  perPerson: Number,
  externalFunding: Number,
  outcomesIntro: String,

  ethAddresses: Mongoose.Schema.Types.Mixed,

  mangoContractWalletId: String,
  mangoBeneficiaryWalletId: String,

  myStory: [{
    img: String,
    header: String,
    quote: String,
    details: String,
    extendedDetails: String,
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
