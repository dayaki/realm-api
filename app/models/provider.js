let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
 
var ProviderSchema = new Schema({
  title: String,
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

module.exports = mongoose.model('Provider', ProviderSchema);