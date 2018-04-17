let mongoose  = require('mongoose');
let Schema    = mongoose.Schema;
let moment    = require('moment');
 
var ArticleSchema = new Schema({
  title: String,
  slug: String,
  content: String,
  color: String,
  category: String,
  tags: [String],
  image: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rating: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  published: {
    type: Boolean,
    required: true
  },
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  // comments: [{
  //   postedBy: {
  //     type: Schema.Types.ObjectId, 
  //     ref: 'User'
  //   },
  //   text: String,
  //   posted_at: {
  //     type: String,
  //     default: moment().format('DD-MM-YYYY')
  //   }
  // }],
  date: {
    type: Date,
    default: Date.now()
  },
  created_at: {
    type: String,
    default: moment().format('DD-MM-YYYY')
  }
});

module.exports = mongoose.model('Article', ArticleSchema);