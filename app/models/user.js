let mongoose = require('mongoose');
let Article = require('./article');
let Schema = mongoose.Schema;
 
var UserSchema = new Schema({
  fbid: String,
  photo: String,
  phone: String,
  website: String,
  author: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String
  },
  articles: [{
    article: {
      type: Schema.Types.ObjectId, 
      ref: 'Article',
      require: true
    }
  }]
});

module.exports = mongoose.model('User', UserSchema);