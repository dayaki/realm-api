let mongoose = require("mongoose");
let Schema = mongoose.Schema;

var UserSchema = new Schema({
  name: String,
  email: String,
  phone: String,
  dob: String,
  address: String,
  department: String
});

module.exports = mongoose.model("User", UserSchema);
