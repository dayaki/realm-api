let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
 
var AdminSchema = new Schema({
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
  role: String
});

module.exports = mongoose.model('Admin', AdminSchema);