let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
let moment   = require('moment');
 
var VouchersSchema = new Schema({
  code: String,
  expiry: String,
  isExpired: {
    type: Boolean,
    default: false
  },
  used: {
    type: Boolean,
    default: false
  },
  timesUsed: {
    type: Number,
    default: 0
  },
  type: String,
  created_at: {
    type: Date,
    default: moment()
  }
});

module.exports = mongoose.model('Vouchers', VouchersSchema);