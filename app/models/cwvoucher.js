let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
let moment   = require('moment');
 
var CWVouchersSchema = new Schema({
  code: String,
  used: {
    type: Boolean,
    default: false
  },
  usage: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: moment()
  }
});

module.exports = mongoose.model('CWVouchers', CWVouchersSchema);