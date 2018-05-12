let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
 
var SermonSchema = new Schema({
  title: String,
  image: String,
  preacher: String,
  featured: String,
  audio: String,
  date: String,
  tags: [{
    type: String
  }]
});

module.exports = mongoose.model('Sermon', SermonSchema);