let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
 
var UserSchema = new Schema({
  fbid: String,
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  photo: String,
  onesignal: String,
  isAdmin: Boolean,
  adminRole: String
});

module.exports = mongoose.model('User', UserSchema);