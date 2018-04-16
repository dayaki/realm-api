let mongoose  = require('mongoose');
let Schema    = mongoose.Schema;
let moment    = require('moment');
 
var QuoteSchema = new Schema({
  image: String,
  likes: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quote', QuoteSchema);