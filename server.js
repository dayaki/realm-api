let express     = require('express');
let bodyParser  = require('body-parser');
let mongoose    = require('mongoose');
let bcrypt      = require('bcrypt-nodejs');
let cors        = require('cors');
let slug        = require('slug');
let config      = require('./config');
var randomColor = require('randomcolor');

// Models
let User      = require('./app/models/user');
let Article   = require('./app/models/article');
let Comment   = require('./app/models/comment');
let Quote     = require('./app/models/quote');
let Category  = require('./app/models/category');

// Variables
let app = express();
let router = express.Router();

app.options('*', cors()) // include before other routes
app.use(cors({origin: 'http://localhost:8100'}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use('/api', router);

// DB connection
mongoose.connect(config.database);

// Middleware
// router.use((req, res, next) => {
//   console.log('calling the middleware');
//   next();
// });

///// Article Routes
router.route('/articles')

  .get((req, res) => {
    Article.find({}).populate('author').populate('comments')
      .exec(function(err, articles) {
        if(err) res.send('Error fetching articles');

        res.json({data: articles});
    });
  })

  .post((req, res) => {
      let article = new Article({
        title: req.body.title,
        slug: slug(req.body.title, {lower: true}),
        author: req.body.author,
        category: req.body.category,
        rating: 0,
        content: req.body.content,
        published: req.body.published,
        color: randomColor({format: 'rgba'})
      });

      article.save(function(err, article) {
        if (err) return res.json({status: err});
        User.update(
          {_id: req.body.author}, 
          {$push: {articles: article._id}}, function(err) {
            if(err) res.send(err);
            res.json({status: 'valid', data: article});
        });
      });
  })

  .put((req, res) => {
    Article.findByIdAndUpdate(req.body.article_id, {$set: {
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      published: req.body.published
    }}, {new: true}, (err, article) => {
      if (err) res.send('Error updating article');

      res.json({status: 'valid', data: article});
    });
  })

  .delete((req, res) => {
    Article.remove({_id : req.body.id}, function(err, article) {
      if(err) res.send('Error deleting the article');

      res.json({status: 'valid', msg: 'Article deleted successfully'});
    });
});

///// User Authentication

// Register new Email User
router.post('auth/user', (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password)
  });

  user.save((err, user) => {
    if(err) return res.json({status: 'Error', data: err});
    res.json({status: 'success', data: user});
  });
});

// FB user Register/Login
router.post('auth/fb', (req, res) => {
  User.findOne({fbid: req.body.fbid}, (err, user) => {
    if(err) res.json({status: 'Error', msg: err});

    res.json({status: 'success', data: user});
  })
});

// Login User
router.post('auth/login', (req, res) => {
  let email = req.body.email;
  let pass = req.body.password;

  User.findOne({email: email}, (err, user) => {
    if (err) res.json({status: 'Error', msg: err});
    if(user === null) res.json({status: 'Error', msg: 'User not found'});

    if(!bcrypt.compareSync(pass, user.password)) {
      res.json({status: 'Error', msg: 'Invalid Password'});
    } else {
      res.json({status: 'valid', data: user});
    }
  });
});

//////// END User Authentication /////////////

// router.route('/auth')
  
  
//   .post((req, res) => {
//     let user = new User({
//       name: req.body.name,
//       email: req.body.email,
//       password: bcrypt.hashSync(req.body.password)
//     });

//     user.save(function(err, user) {
//       if(err) return res.json({status: 'Error', data: err});
//       res.json({status: 'success', data: user});
//     });

//   })

//   // Login
//   .post((req, res) => {
//     let email = req.body.email;
//     let pass = req.body.password;

//     User.findOne({email: email}, function(err, user) {
//       if (err || user === null) {
//         res.json({status: 'Error', msg: 'Invalid Email'});
//       }

//       if(!bcrypt.compareSync(pass, user.password)) {
//         res.json({status: 'Error', msg: 'Invalid Password'});
//       } else {
//         res.json({status: 'valid', data: user});
//       }
//     });
// });

///// User Routes
router.get('/users/:id', (req, res) => {
  User.find({fbid: req.params.id}, (err, user) => {
    if(err) res.send('No user found');
    res.json({status: 'success', data: user});
  })
});

router.route('/users')
  
  .get((req, res) => {
    User.find(function(err, users) {
      if (err) return res.send(err.errmsg);
      res.json(users);
    })
  })

  // FB register
  .post((req, res) => {
    let user = new User({
      fbid: req.body.fbid,
      name: req.body.name,
      email: req.body.email,
      photo: req.body.photo
    });

    user.save((err, user) => {
      if(err) res.send(err.message);
      res.json({status: 'success', data: user});
    });
  })

  // Update User Photo
  .patch((req, res) => {
    User.findByIdAndUpdate(req.body.user_id, {$set: {
      photo: req.body.photo
    }}, {new: true}, (err, user) => {
      if(err) res.send('Error updating photo');

      res.json({status: 'valid', data: user.photo});
    });
  })

  // Update User info
  .put((req, res) => {
    if (req.body.password === undefined) {
      User.findByIdAndUpdate(req.body.user_id, {$set: {
        name: req.body.name,
        phone: req.body.phone,
        website: req.body.website
      }}, {new: true}, (err, article) => {
        if(err) res.send('Error updating user');
        res.json({status: 'valid', data: user});
      });
    } else {
      User.findByIdAndUpdate(req.body.user_id, {$set: {
        name: req.body.name,
        phone: req.body.phone,
        website: req.body.website,
        password: bcrypt.hashSync(req.body.password)
      }}, {new: true}, (err, user) => {
        if(err) res.send('Error updating user');
        res.json({status: 'valid', data: user});
      });
    }
});

///// Quotes route
router.route('/quotes')
  .get((req, res) => {
    Quote.find({}, (err, quotes) => {
      if(err) res.send('Error fetching quotes');

      res.json({status: 'success', data: quotes});
    })
});

///// Category route
router.route('/categories')
  .get((req, res) => {
    Category.find({}, (err, categories) => {
      if(err) res.json({status: 'error'});

      res.json(categories);
    })
  })

  .post((req, res) => {
    let category = new Category({
      name: req.body.name
    });

    category.save((err, category) => {
      if(err) res.json({status: 'error'});

      res.json({status: 'success'});
    });
});

///// Report Article
router.post('/articles/report/', (req, res) => {
  res.json({req: req.body.article_id, content: req.body.report});
});

///// Rate Article
router.post('/articles/rate', (req, res) => {
  res.json({rate: req.body.rate});
}) 

// Comment Routes
// router.route('/comment')
//   .get((req, res) => {
//     Comment.find({}).populate('user').populate('article')
//       .exec((err, comments) => {
//         if (err) res.send('Error finding comments');

//         res.json(comments);
//       });
//   })

//   .post((req, res) => {
//     let comment = new Comment({
//       comment: req.body.comment,
//       user: req.body.user_id,
//       article: req.body.article_id
//     });

//     comment.save((err) => {
//       if(err) res.send('Error posting comment');

//       Article.findById(req.body.article_id, (err, article) => {
//         if(err) res.send('Error finding article');

//         article.comments.push(comment);
//         article.save((err, article) => {
//           if(err) res.send('Error saving comments to article');

//           res.json({status: 'valid', msg: 'comment added successfully'});
//         });
//       });
//     });
//   });
///// END Comment ////////

// listen (start app with node server.js) =====================
// app.listen(config.port);
app.listen(process.env.PORT || 3000)
console.log('Dragons are alive at port ' + config.port);