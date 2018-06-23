let express     = require('express');
let bodyParser  = require('body-parser');
let mongoose    = require('mongoose');
let bcrypt      = require('bcrypt-nodejs');
let cors        = require('cors');
let slug        = require('slug');
let config      = require('./config');

// Models
let User      = require('./app/models/user');
let Sermon    = require('./app/models/sermon');
let Note      = require('./app/models/note');
let Give      = require('./app/models/give');

// Variables
let app = express();
let router = express.Router();

app.use(cors());
app.options('*', cors()) // include before other routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({limit: '5mb'}));
app.use('/api', router);

// DB connection
mongoose.connect(config.database);

router.get('/', (req, res) => {
  res.send("yeah it's working...")
});

// Register new Email User
router.post('/auth/user', (req, res) => {
  User.findOne({email: req.body.email}, (err, data) => {
    if (err) res.json({ status: 'error', data: err });

    if (data !== null)  {
      res.json({status: 'error', msg: 'Email is already used.'});
    } else {
      let newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password),
        onesignal: req.body.onesignal
      });

      newUser.save((err, user) => {
        if(err) return res.json({status: 'Error', data: err});
        res.json({status: 'success', data: user});
      });

    }    
  });
});

// Login User
router.post('/auth/login', (req, res) => {
  let email = req.body.email;
  let pass = req.body.password;

  User.findOne({email: email}, (err, user) => {
    if (err) res.json({ status: 'error', msg: err });

    if (user === null) {
      res.json({ status: 'error', msg: 'User not found.' });
    } else {
      if (!bcrypt.compareSync(pass, user.password)) {
        res.json({ status: 'error', msg: 'Invalid Username or Password.' });
      } else {
        res.json({ status: 'success', data: user });
      }
    }

  });

});

// FB user Register/Login
router.post('/auth/fb', (req, res) => {
  User.findOne({fbid: req.body.fbid}, (err, user) => {
    if(err) res.json({status: 'Error', msg: err});

    if (user === null) {
      let user = new User({
        fbid: req.body.fbid,
        name: req.body.name,
        email: req.body.email,
        photo: req.body.photo,
        onesignal: req.body.onesignal
      });
  
      user.save((err, user) => {
        if(err) res.send(err.message);

        res.json({ status: 'success', data: user });
      });
    } else {
      res.json({ status: 'success', data: user });
    };
  });

});

// Admin Auth
router.post('/auth/admin', (req, res) => {
  User.findOne({
    email: req.body.username,
    isAdmin: true
  }, (err, user) => {
    if (err) res.json({ status: 'error', msg: err });

    if (user === null) {
      res.json({ status: 'error', msg: 'User not found.' });
    } else {
      if (!bcrypt.compareSync(req.body.password, user.password)) {
        res.json({ status: 'error', msg: 'Invalid Username or Password.' });
      } else {
        res.json({ status: 'success', data: user });
      }
    }

  });
});

router.post('/admin/new', (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password),
    isAdmin: true,
    adminRole: req.body.role
  });

  user.save((err, user) => {
    if(err) res.json({ status: 'error', data: err });

    res.json({ status: 'success', data: user });
  });

});



///// User Routes
router.route('/users')
  
  .get((req, res) => {
    User.find(function(err, users) {
      if (err) return res.send(err.errmsg);
      res.json({data: users});
    })
  })

  // Update User Photo
  .patch((req, res) => {
    User.findByIdAndUpdate(req.body.user_id, {$set: {
      photo: req.body.photo
    }}, {new: true}, (err, user) => {
      if(err) res.send('Error updating photo');
      res.json({status: 'valid', data: user});
    });
  })

  // Update User info
  .put((req, res) => {
    if (req.body.password === undefined) {
      User.findByIdAndUpdate(req.body.user_id, {$set: {
        name: req.body.name,
        phone: req.body.phone,
        website: req.body.website
      }}, {new: true}, (err, user) => {
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

// Sermons
router.route('/sermons')

  .get((req, res) => {
    Sermon.find({}, (err, sermons) => {
      if (err) res.json({ status: 'error', msg: err });

      res.json({ status: 'success', data: sermons });
    })
  })

  .post((req, res) => {
    let sermon = new Sermon({
      title: req.body.title,
      preacher: req.body.preacher,
      image: req.body.image,
      audio: req.body.audio,
      date: req.body.date,
      featured: req.body.featured,
      tags: req.body.tags.split(',')
    });

    sermon.save((err, sermom) => {
      if (err) res.json({ status: 'error' });

      res.json({ status: 'success', data: sermon });
    })
  })

// Notes
router.get('/notes/:id', (req, res) => {
  Note.find({author: req.params.id}, (err, notes) => {
    if(err) res.json({ status: 'error' });

    res.json({ status: 'success', data: notes });
  });
});

router.post('/notes', (req, res) => {
  let note = new Note({
    title: req.body.title,
    preacher: req.body.preacher,
    content: req.body.content,
    author: req.body.user
  });

  note.save((err, user) => {
    if(err) res.json({ status: 'error', msg: err.message });

    res.json({ status: 'success', data: note });
  });

});

// Online Giving
router.get('/giving', (req, res) => {
  Give.find({}, (err, give) => {
    if(err) res.json({ status: 'error', msg: err });

    res.json({ status: 'success', data: give });
  });
});

router.post('/giving', (req, res) => {
  let give = new Give({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    amount: req.body.amount,
    type: req.body.type,
    txn_ref: req.body.ref
  });

  give.save((err, give) => {
    if(err) res.json({ status: 'error', msg: err });

    res.json({ status: 'success', data: give });
  });

});

// listen (start app with node server.js) =====================
// app.listen(config.port);
app.listen(config.port);
console.log('Dragons are alive at port ' + config.port);