let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
 
var VouchersSchema = new Schema({
  code: String,
  expiry: String,
  used: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Vouchers', VouchersSchema);