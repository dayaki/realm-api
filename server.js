let express     = require('express');
let bodyParser  = require('body-parser');
let mongoose    = require('mongoose');
let bcrypt      = require('bcrypt-nodejs');
let cors        = require('cors');
let slug        = require('slug');
let config      = require('./config');
let moment      = require('moment');
let OneSignal   = require('onesignal-node');
const nodemailer = require('nodemailer');
let Email 	    = require("emailjs");

// Models
let User      = require('./app/models/user');
let Sermon    = require('./app/models/sermon');
let Note      = require('./app/models/note');
let Give      = require('./app/models/give');
let Events    = require('./app/models/event');
let Voucher   = require('./app/models/voucher');

// Variables
let app = express();
let router = express.Router();

app.use(cors());
app.options('*', cors()) // include before other routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({limit: '5mb'}));
app.use('/api', router);

// DB connection
mongoose.set('useCreateIndex', true)
mongoose.connect(config.database, { useNewUrlParser: true });

router.get('/', (req, res) => {
  res.send("yeah it's working...")
});


////////////////////////////////////////
////////  APP API ROUTES //////////////
////////////////////////////////////////

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
        phone: req.body.phone,
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

  User.findOne({email: email, isAdmin: 'false'}, (err, user) => {
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
      User.findByIdAndUpdate(user._id, { $set: { photo: req.body.photo }}, (err, user) => {
        res.json({ status: 'success', data: user });
      });
    };
  });

});

// User
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
  }}, {new: false}, (err, user) => {
    if (err) res.json({ status: 'Error', msg: err });
    res.json({status: 'valid', data: user});
  });
})

// Get all Sermons
router.get('/sermons', (req, res) => {
  const then = new Date('2018-01-01').toISOString();
  Sermon.find().where('isodate').gte(then).sort({isodate: -1}).exec((err, sermons) => {
    if (err) res.json({ status: 'error', msg: err });
    res.json({ status: 'success', data: sermons });
  });
});

// Get user notes
router.get('/notes/:id', (req, res) => {
  Note.find({author: req.params.id}, (err, notes) => {
    if(err) res.json({ status: 'error' });

    res.json({ status: 'success', data: notes });
  });
});

// Post new note
router.post('/notes', (req, res) => {
  let userId = req.body.user;

  let note = new Note({
    title: req.body.title,
    preacher: req.body.preacher,
    content: req.body.content,
    author: req.body.user
  });

  note.save((err, note) => {
    if(err) res.json({ status: 'error', msg: err.message });

    Note.find({author: userId}).sort({ created_at: -1}).exec((err, notes) => {
      if(err) res.json({ status: 'Error', msg: err })
      res.json({ status: 'success', data: notes });
    });
  });
});

// Update Note
router.post('/note/update', (req, res) => {
  Note.findByIdAndUpdate(req.body.note, {$set: {
    title: req.body.title,
    preacher: req.body.preacher,
    content: req.body.content
  }}, (err, note) => {
    if(err) res.json({ status: 'error', msg: err });

    Note.find({author: req.body.user}).sort({ created_at: -1}).exec((err, notes) => {
      if (err) res.json({ status: 'Error', msg: err })
      else res.json({ status: 'success', data: notes });
    });
  });
})

// Delete Note
router.post('/note/delete', (req, res) => {
  Note.findByIdAndRemove(req.body.note, (err, note) => {
    if(err) res.json({status: 'error', msg: err});

    Note.find({author: req.body.user}).sort({ created_at: -1 }).exec((err, notes) => {
      if(err) res.json({ status: 'Error', msg: err })
      res.json({ status: 'success', data: notes });
    });
  });
})

// Online Giving
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

// Events
router.get('/events', (req, res) => {
  Events.find({}, (err, events) => {
    if (err) res.json({ status: 'error', msg: err })
    else res.json({ status: 'success', data: events })
  });
});

// Support email
router.get('/support', (req, res) => {
  const server 	= Email.server.connect({
    user:    "mailer@realmofglory.org",
    password:"realmHQ01",
    host:    "host51.registrar-servers.com",
    ssl:     true
  });

  // send the message and get a callback with an error or details of the message that was sent
  server.send({
    text:    "i hope this works",
    from:    "Realm Mailer <mailer@realmofglory.org>",
    to:      "Dave <me@sprypixels.com>",
    subject: "testing emailjs"
  }, function(err, message) { console.log(err || message); });
  // let smtpConfig = {
  //   host: 'host51.registrar-servers.com',
  //   port: 465,
  //   secure: true,
  //   auth: {
  //     user: 'mailer@realmofglory.org',
  //     pass: 'realmHQ01'
  //   },
  //   tls: {
  //     rejectUnauthorized: false
  //   }
  // };

  // const transporter = nodemailer.createTransport(smtpConfig);
  // const mainOptions = {
  //   from: 'mailer@realmofglory.org',
  //   to: 'me@sprypixels.com',
  //   subject: 'Hello from Server',
  //   text: 'hello world!',
  //   html: '<b>Hello World!</b>',
  // };
  // const callback = function (err, info) {
  //   if (err) { throw err }
  //   console.log('sent');
  // }

  // transporter.sendMail(mainOptions, callback);
});


///////////////////////////////////////////
////////  Backend API ROUTES //////////////
///////////////////////////////////////////

// Admin Auth
router.post('/admin/auth', (req, res) => {
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

// Post Sermons
router.post('/admin/sermons', (req, res) => {
  let sermon = new Sermon({
    title: req.body.title,
    slug: slug(req.body.title, {lower: true}),
    preacher: req.body.preacher,
    image: req.body.image,
    audio: req.body.audio,
    date: req.body.date,
    isodate: new Date(Date.now()).toISOString(),
    featured: req.body.featured,
    tags: req.body.tags.split(',')
  });

  sermon.save((err, sermom) => {
    if (err) res.json({ status: 'error' });
    res.json({ status: 'success', data: sermon });
  });

});

// Fetch online givers
router.get('/giving', (req, res) => {
  Give.find({}, (err, give) => {
    if(err) res.json({ status: 'error', msg: err });

    res.json({ status: 'success', data: give });
  });
});

// Post Events
router.post('/admin/events', (req, res) => {
  let event = new Events({
    title: req.body.title,
    image: req.body.image,
    desc: req.body.desc,
    address: req.body.address,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    time: req.body.time
  });

  event.save((err, event) => {
    if(err) res.json({ status: 'error', msg: err })
    else res.json({ status: 'success', data: event })
  });
});

// Vouchers
router.get('/admin/vouchers', (req, res) => {
  Voucher.find({ used: false}, (err, vouchers) => {
    if (err) res.json({ status: 'error', data: err })
    res.json({ status: 'success', data: vouchers })
  });
});

router.get('/admin/vouchers/new', (req, res) => {
  // let today = moment();
  // let nextMonth = moment().add(1, 'months');
  // let expired = today.isSameOrBefore(nextMonth);
  // res.json({ today, nextMonth, expired })
  const type = req.body.type;
  if (type === 1) {
    while (length < 20 ) {
      let string = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      let voucher = new Voucher({
        code: string,
        expiry: moment().add(1, 'months'),
        type: '1 Month'
      });
  
      voucher.save((err, vou) => {
        if (err) res.json({ status: 'error' })
      });
  
      length = length + 1;
    }
  } else if (type === 3) {
    while (length < 20 ) {
      let string = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      let voucher = new Voucher({
        code: string,
        expiry: moment().add(3, 'months'),
        type: '3 Months'
      });
  
      voucher.save((err, vou) => {
        if (err) res.json({ status: 'error' })
      });
  
      length = length + 1;
    }
  } else if (type === 6) {
    while (length < 20 ) {
      let string = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      let voucher = new Voucher({
        code: string,
        expiry: moment().add(6, 'months'),
        type: '6 Months'
      });
  
      voucher.save((err, vou) => {
        if (err) res.json({ status: 'error' })
      });
  
      length = length + 1;
    }
  } else if (type === 12) {
    while (length < 20 ) {
      let string = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      let voucher = new Voucher({
        code: string,
        expiry: moment().add(12, 'months'),
        type: '1 Year'
      });
  
      voucher.save((err, vou) => {
        if (err) res.json({ status: 'error' })
      });
  
      length = length + 1;
    }
  }

  let length = 0;
  while (length < 20 ) {
    let string = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    let voucher = new Voucher({
      code: string,
      expiry: moment().add(1, 'months'),
      type: '1 Month'
    });

    voucher.save((err, vou) => {
      if (err) res.json({ status: 'error' })
    });

    length = length + 1;
  }

  Voucher.find({ used: false}, (err2, vouchers) => {
    if (err2) res.json({ status: 'error', data: err2 })
    res.json({ status: 'success', data: vouchers })
  });
})

// listen (start app with node server.js) =====================
// app.listen(config.port);
app.listen(config.port);
console.log('Dragons are alive at port ' + config.port);