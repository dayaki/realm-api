let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
 
var EventsSchema = new Schema({
  title: String,
  image: String,
  desc: String,
  address: String,
  startDate: String,
  endDate: String,
  time: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Events', EventsSchema);