var Mongoose = require('mongoose');
var Outcome = require('./outcome');
var htmlencode = require('htmlencode');

var CampaignSchema = new Mongoose.Schema({
  code: {type: String, unique: true},
  title: String,
  status: {
    type: String,
    enum: ['FINISHED', 'ACTIVE', 'PENDING'],
    default: 'PENDING'
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
  costBreakdown: String,

  peopleTarget: Number,
  fundingTarget: Number,
  perPerson: Number,
  externalFunding: Number,
  outcomesIntro: String,
  contractAddress: String,

  myStory: [{
    img: String,
    header: String,
    details: String
  }],
  _outcomes: [{
    type: Mongoose.Schema.ObjectId,
    ref: 'Outcome'
  }],
  _parentId: {
    type: Mongoose.Schema.ObjectId,
    ref: 'Category'
  }
});

const fieldsToDecode = ['lead', 'summary', 'project', 'serviceProvider', 'beneficiary', 'validator', 'costBreakdown', 'outcomesIntro'];

CampaignSchema.pre('remove', function (next) {
  Outcome.find({_parentId: this._id}).remove(function () {
    console.log("Removing nested outcomes");
  });
  next();
});

CampaignSchema.methods.htmlFieldsDecode = function () {
  var project = this;
  fieldsToDecode.forEach(function (field) {
    project[field] = htmlencode.htmlDecode(project[field]);
  });
  project.myStory.forEach(function (story) {
    story.header = htmlencode.htmlDecode(story.header);
    story.details = htmlencode.htmlDecode(story.details);
  });
};

module.exports = Mongoose.model('Campaign', CampaignSchema);