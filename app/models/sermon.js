let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
 
var SermonSchema = new Schema({
  title: String,
  slug: String,
  image: String,
  preacher: String,
  featured: String,
  audio: String,
  date: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String
  }]
});

module.exports = mongoose.model('Sermon', SermonSchema);