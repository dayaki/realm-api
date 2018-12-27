let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let moment = require("moment");

var ArticleSchema = new Schema({
  title: String,
  slug: String,
  image: String,
  author: String,
  color: String,
  mdob: Date,
  created_at: {
    type: Date,
    default: moment()
  }
});

module.exports = mongoose.model("Article", ArticleSchema);
