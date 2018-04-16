let mongoose  = require('mongoose');
let Schema    = mongoose.Schema;
let moment    = require('moment');
 
var FavoriteSchema = new Schema({
  article: {
    type: Schema.Types.ObjectId,
    ref: 'Article'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Favorite', FavoriteSchema);