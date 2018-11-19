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
  phone: String,
  photo: String,
  onesignal: String,
  sub_active: {
    type: Boolean,
    default: false
  },
  sub_end: Date,
  isAdmin: {
    type: Boolean,
    default: false
  },
  adminRole: String
});

module.exports = mongoose.model('User', UserSchema);