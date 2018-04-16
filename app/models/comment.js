let mongoose  = require('mongoose');
let Schema    = mongoose.Schema;
let moment    = require('moment');
 
var CommentSchema = new Schema({
  comment: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  article: {
    type: Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', CommentSchema);