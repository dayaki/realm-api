let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
 
var GiveSchema = new Schema({
  name: String,
  email: String,
  phone: String,
  amount: Number,
  type: String,
  txn_ref: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Give', GiveSchema);