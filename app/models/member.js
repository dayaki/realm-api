let mongoose = require("mongoose");
let Schema = mongoose.Schema;

var MemberSchema = new Schema({
  name: String,
  email: String,
  phone: String,
  dob: String,
  mdob: Date,
  address: String,
  department: String
});

module.exports = mongoose.model("Member", MemberSchema);
