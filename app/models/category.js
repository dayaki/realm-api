let mongoose  = require('mongoose');
let Schema    = mongoose.Schema;
let moment    = require('moment');
 
var CategorySchema = new Schema({
  name: String,
  image: String
});

module.exports = mongoose.model('Category', CategorySchema);