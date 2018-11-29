let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
let moment   = require('moment');
 
var AttendanceSchema = new Schema({
  date: String,
  iosdate: String,
  men: String,
  women: String,
  children: String,
  summary: String,
  serviceType: String,
  created_at: {
    type: Date,
    default: moment()
  }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);