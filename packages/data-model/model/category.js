var Mongoose = require('mongoose');
var Campaign = require('./campaign');

var CategorySchema = new Mongoose.Schema({
  title: String,
  lead: String,
  img: String,
  _campaigns: [{
    type: Mongoose.Schema.ObjectId,
    ref: 'Campaign'
  }]
});

CategorySchema.pre('remove', function (next) {
  Campaign.find({_parentId: this._id}).remove(function () {
    console.log("Removing nested campaigns");
  });
  next();
});

module.exports = Mongoose.model('Category', CategorySchema);
