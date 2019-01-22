const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");
const genVoucher = require("voucher-code-generator");
const cors = require("cors");
const slug = require("slug");
const config = require("./config");
const moment = require("moment");
const OneSignal = require("onesignal-node");
const Email = require("emailjs");
const randomColor = require("randomcolor");

// Models
const User = require("./app/models/user");
const Admin = require("./app/models/admin");
const Article = require("./app/models/article");
const Sermon = require("./app/models/sermon");
const Note = require("./app/models/note");
const Give = require("./app/models/give");
const Events = require("./app/models/event");
const Voucher = require("./app/models/voucher");
const CWVoucher = require("./app/models/cwvoucher");
const Attendance = require("./app/models/attendance");
const Member = require("./app/models/member");

// Variables
let app = express();
let router = express.Router();

app.use(cors());
app.options("*", cors()); // include before other routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "5mb" }));
app.use("/api", router);

// DB connection
mongoose.set("useCreateIndex", true);
mongoose.connect(
  config.database,
  { useNewUrlParser: true }
);

router.get("/", (req, res) => {
  res.send("yeah it's working...");
});

router.post("/cw/voucher/verify", (req, res) => {
  CWVoucher.findOne({ code: req.body.voucher }, (err, data) => {
    if (err) res.json({ status: "invalid", data: err });

    if (data !== null) {
      if (data.usage > 4) {
        res.json({ status: "usage" });
      } else {
        CWVoucher.findByIdAndUpdate(
          data._id,
          { $set: { used: true, usage: +1 } },
          { new: true },
          (err, user) => {
            res.json({ status: "success", data: user });
          }
        );
      }
    } else {
      res.json({ status: "error", data: err });
    }
  });
});

////////////////////////////////////////
////////  APP API ROUTES //////////////
////////////////////////////////////////

// Register new Email User
router.post("/auth/user", (req, res) => {
  User.findOne({ email: req.body.email }, (err, data) => {
    if (err) res.json({ status: "error", data: err });

    if (data !== null) {
      res.json({ status: "error", msg: "Email is already used." });
    } else {
      let newUser = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: bcrypt.hashSync(req.body.password),
        onesignal: req.body.onesignal
      });

      newUser.save((err, user) => {
        if (err) return res.json({ status: "Error", data: err });
        res.json({ status: "success", data: user });
      });
    }
  });
});

// Login User
router.post("/auth/login", (req, res) => {
  const email = req.body.email;
  const pass = req.body.password;

  User.findOne({ email: email }, function(err, user) {
    if (err) res.json({ status: "error", msg: err });

    if (user === null) {
      res.json({ status: "error", msg: "User is not registered." });
    } else {
      if (!bcrypt.compareSync(pass, user.password)) {
        res.json({ status: "error", msg: "Invalid Username or Password." });
      } else {
        res.json({ status: "success", data: user });
      }
    }
  });
});

// FB user Register/Login
router.post("/auth/fb", (req, res) => {
  User.findOne({ fbid: req.body.fbid }, (err, user) => {
    if (err) res.json({ status: "Error", msg: err });

    if (user === null) {
      let user = new User({
        fbid: req.body.fbid,
        name: req.body.name,
        email: req.body.email,
        photo: req.body.photo,
        onesignal: req.body.onesignal
      });

      user.save((err, user) => {
        if (err) res.send(err.message);

        res.json({ status: "success", data: user });
      });
    } else {
      User.findByIdAndUpdate(
        user._id,
        { $set: { photo: req.body.photo } },
        (err, user) => {
          res.json({ status: "success", data: user });
        }
      );
    }
  });
});

// User
router
  .route("/users")

  .get((req, res) => {
    User.find(function(err, users) {
      if (err) return res.send(err.errmsg);
      res.json({ data: users });
    });
  })

  // Update User Photo
  .patch((req, res) => {
    User.findByIdAndUpdate(
      req.body.user_id,
      {
        $set: {
          photo: req.body.photo
        }
      },
      { new: false },
      (err, user) => {
        if (err) res.json({ status: "Error", msg: err });
        res.json({ status: "valid", data: user });
      }
    );
  });

// Update user expiry
router.post("/user/expired", (req, res) => {
  User.findOneAndUpdate(
    { _id: req.body.user },
    { $set: { sub_active: false } },
    { new: true },
    (err, user) => {
      if (err) res.json({ status: "error", msg: err });
      res.json({ status: "success", data: user });
    }
  );
});

// Get all Sermons
router.get("/sermons", (req, res) => {
  const then = new Date("2018-01-01").toISOString();
  Sermon.find()
    .where("isodate")
    .gte(then)
    .sort({ isodate: -1 })
    .exec((err, sermons) => {
      if (err) res.json({ status: "error", msg: err });
      res.json({ status: "success", data: sermons });
    });
});

// Fetch articles
router.get("/articles", (req, res) => {
  Article.find()
    .sort({ created_at: -1 })
    .exec((err, articles) => {
      if (err) res.json({ status: "error", msg: err });
      res.json({ status: "success", data: articles });
    });
});

// Get user notes
router.get("/notes/:id", (req, res) => {
  Note.find({ author: req.params.id }, (err, notes) => {
    if (err) res.json({ status: "error" });

    res.json({ status: "success", data: notes });
  });
});

// Post new note
router.post("/notes", (req, res) => {
  let userId = req.body.user;

  let note = new Note({
    title: req.body.title,
    preacher: req.body.preacher,
    content: req.body.content,
    author: req.body.user
  });

  note.save((err, note) => {
    if (err) res.json({ status: "error", msg: err.message });

    Note.find({ author: userId })
      .sort({ created_at: -1 })
      .exec((err, notes) => {
        if (err) res.json({ status: "Error", msg: err });
        res.json({ status: "success", data: notes });
      });
  });
});

// Update Note
router.post("/note/update", (req, res) => {
  Note.findByIdAndUpdate(
    req.body.note,
    {
      $set: {
        title: req.body.title,
        preacher: req.body.preacher,
        content: req.body.content
      }
    },
    (err, note) => {
      if (err) res.json({ status: "error", msg: err });

      Note.find({ author: req.body.user })
        .sort({ created_at: -1 })
        .exec((err, notes) => {
          if (err) res.json({ status: "Error", msg: err });
          else res.json({ status: "success", data: notes });
        });
    }
  );
});

// Delete Note
router.post("/note/delete", (req, res) => {
  Note.findByIdAndRemove(req.body.note, (err, note) => {
    if (err) res.json({ status: "error", msg: err });

    Note.find({ author: req.body.user })
      .sort({ created_at: -1 })
      .exec((err, notes) => {
        if (err) res.json({ status: "Error", msg: err });
        res.json({ status: "success", data: notes });
      });
  });
});

// Online Giving
router.post("/giving", (req, res) => {
  let give = new Give({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    amount: req.body.amount,
    type: req.body.type,
    txn_ref: req.body.ref
  });

  give.save((err, give) => {
    if (err) res.json({ status: "error", msg: err });

    res.json({ status: "success", data: give });
  });
});

// Voucher paid for
router.post("/voucher/paymemt", (req, res) => {
  let vouc = new Voucher({
    code: req.body.voucher,
    expiry: moment().add(req.body.type, "months"),
    type: `${req.body.type} Month`
  });

  vouc.save((err, vouOne) => {
    if (err) res.json({ status: "error" });

    if (req.body.user !== null) {
      User.findOneAndUpdate(
        { _id: req.body.user },
        {
          $set: {
            sub_active: true,
            sub_end: moment().add(req.body.type, "months")
          }
        },
        { new: true },
        (err, user) => {
          if (err) res.json({ status: "error" });
          res.json({ status: "user", data: user });
        }
      );
    } else {
      res.json({ status: "success", data: vouOne });
    }
  });
});

// Update Voucher usage
router.post("/voucher/usage", (req, res) => {
  Voucher.findOneAndUpdate(
    { _id: req.body.voucher },
    { $set: { used: true, timesUsed: +1 } },
    { new: true },
    (err, vouc) => {
      if (err) res.json({ status: "error", msg: err });
      res.json({ status: "success", data: vouc });
    }
  );
});

// Update voucher expiry
router.post("/voucher/expired", (req, res) => {
  Voucher.findOneAndUpdate(
    { _id: req.body.voucher },
    { $set: { isExpired: true } },
    { new: true },
    (err, userVouch) => {
      if (err) res.json({ status: "error", msg: err });
      res.json({ status: "success", data: userVouch });
    }
  );
});

// Validate Voucher
router.post("/voucher/verify", (req, res) => {
  Voucher.findOne({ code: req.body.voucher }, (err, voucher) => {
    if (err) res.json({ status: "error", data: err });

    if (voucher === null) {
      res.json({ status: "invalid" });
    } else {
      if (voucher.isExpired) {
        res.json({ status: "expired" });
      }
      if (voucher.timesUsed > 10) {
        res.json({ status: "usedup" });
      }

      // new voucher
      if (!voucher.used) {
        const expiry = moment().add(voucher.type.charAt(0), "months");
        if (req.body.user !== null) {
          User.findOneAndUpdate(
            { id: req.body.user },
            { $set: { sub_active: true, sub_end: expiry } },
            (err, user) => {}
          );
        }
        Voucher.findOneAndUpdate(
          { _id: voucher._id },
          { $set: { expiry, device: req.body.device } },
          { new: true },
          (err, info) => {
            if (err) res.json({ status: "error" });
            res.json({ status: "voucher", data: info });
          }
        );
      }

      // Already used voucher
      if (voucher.used) {
        if (voucher.device !== req.body.device) {
          res.json({ status: "device" });
        }
        let today = moment();
        const vouchExpiry = moment(voucher.expiry);
        // console.log("expired - ", vouchExpiry.isBefore(today));
        if (vouchExpiry.isBefore(today)) {
          // voucher has expired
          Voucher.findOneAndUpdate(
            { _id: voucher._id },
            { $set: { isExpired: true, used: true } },
            { new: true },
            (err1, newVouch) => {
              if (err1) res.json({ status: "error", msg: err });
              if (req.body.user !== null) {
                User.findOneAndUpdate(
                  { _id: req.body.user },
                  { $set: { sub_active: false } },
                  { new: true },
                  (err, expiredUser) => {
                    res.json({ status: "userExpired", data: expiredUser });
                  }
                );
              } else {
                res.json({ status: "voucherExpired", voucher: newVouch });
              }
            }
          );
        } else {
          // voucher NOT expired
          if (req.body.user !== null) {
            User.findOneAndUpdate(
              { _id: req.body.user },
              { $set: { sub_active: true, sub_end: voucher.expiry } },
              { new: true },
              (err1, user) => {
                res.json({ status: "userSuccess", user: user });
              }
            );
          } else {
            res.json({ status: "voucherSuccess", data: voucher });
          }
        }
      }
    }
  });
});

// Events
router.get("/events", (req, res) => {
  Events.find({}, (err, events) => {
    if (err) res.json({ status: "error", msg: err });
    else res.json({ status: "success", data: events });
  });
});

// Support email
router.post("/support", (req, res) => {
  const server = Email.server.connect({
    user: "mailer@realmofglory.org",
    password: "realmHQ01",
    host: "host51.registrar-servers.com",
    ssl: true
  });

  server.send(
    {
      text: req.body.message,
      from: "Realm Mailer <mailer@realmofglory.org>",
      to: "Web Team <webteam@realmofglory.org>",
      bcc: "<olasland@gmail.com>, <akindotun@gmail.com>, <me@sprypixels.com>",
      subject: "Support Message from App",
      attachment: [
        {
          data: `<html>
              <div>
                <h3>Support request from the app</h3>
                <p>We have someone needing support with the Realm of Glory mobile app, see details below:</p>
                <p>
                  Name: ${req.body.name} <br/>
                  Email: ${req.body.email} <br/>
                  Phone: ${req.body.phone} <br/>
                </p>
                  <hr/>
                  <p style="padding:5px 0px;">
                    "${req.body.message}"
                  </p>
                  <hr/>
              </div>
            </html>`,
          alternative: true
        }
      ]
    },
    function(err, message) {
      if (err) res.json({ status: "Error", msg: err });
      else res.json({ status: "success", data: message });
    }
  );
});

// Prayer Request
router.post("/prayers", (req, res) => {
  const server = Email.server.connect({
    user: "mailer@realmofglory.org",
    password: "realmHQ01",
    host: "host51.registrar-servers.com",
    ssl: true
  });

  server.send(
    {
      text: req.body.message,
      from: "Realm Mailer <mailer@realmofglory.org>",
      to: "Realm Pastor <pastor@realmofglory.org>",
      bcc: "<olasland@gmail.com>",
      subject: "Prayer Request from mobile App",
      attachment: [
        {
          data: `<html>
              <div>
                <h3>Support request from the app</h3>
                <p>There is a new prayer request/counseling request from the mobile app, see details below:</p>
                <p>
                  Name: ${req.body.name} <br/>
                  Email: ${req.body.email} <br/>
                  Phone: ${req.body.phone} <br/>
                  Counseling?: ${req.body.counseling} <br/>
                </p>
                  <hr/>
                  <p style="padding:5px 0px;">
                    "${req.body.message}"
                  </p>
                  <hr/>
              </div>
            </html>`,
          alternative: true
        }
      ]
    },
    function(err, message) {
      if (err) res.json({ status: "Error", msg: err });
      else res.json({ status: "success", data: message });
    }
  );
});

///////////////////////////////////////////
////////  Backend API ROUTES //////////////
///////////////////////////////////////////

// Admin Auth
router.post("/admin/auth", (req, res) => {
  Admin.findOne({ email: req.body.username }, (err, user) => {
    if (err) res.json({ status: "error", msg: err });

    if (user === null) {
      res.json({ status: "error", msg: "User not found." });
    } else {
      if (!bcrypt.compareSync(req.body.password, user.password)) {
        res.json({ status: "error", msg: "Invalid Username or Password." });
      } else {
        res.json({ status: "success", data: user });
      }
    }
  });
});

router.post("/admin/user/new", (req, res) => {
  let user = new Admin({
    name: req.body.name,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password),
    role: req.body.role
  });

  user.save((err, user) => {
    if (err) res.json({ status: "error", data: err });
    res.json({ status: "success", data: user });
  });
});

router.post("/admin/user/password", (req, res) => {
  const password = bcrypt.hashSync(req.body.password);
  Admin.findOneAndUpdate(
    { _id: req.body.user },
    { $set: { password } },
    { new: true },
    (err, user) => {
      if (err) res.json({ status: "error", msg: err });
      res.json({ status: "success", data: user });
    }
  );
});

// Post Article
router.post("/admin/article", (req, res) => {
  const article = new Article({
    title: req.body.title,
    slug: slug(req.body.title, { lower: true }),
    content: req.body.content,
    image: req.body.image || "",
    author: req.body.author,
    color: randomColor({ format: "rgba", alpha: 0.8, count: 1 })
  });

  article.save((err, article) => {
    if (err) res.json({ status: "error", msg: err });
    res.json({ status: "success", data: article });
  });
});

// Post Sermons
router.post("/admin/sermons", (req, res) => {
  let sermon = new Sermon({
    title: req.body.title,
    slug: slug(req.body.title, { lower: true }),
    preacher: req.body.preacher,
    image: req.body.image,
    audio: req.body.audio,
    date: req.body.date,
    isodate: new Date(Date.now()).toISOString(),
    featured: req.body.featured,
    tags: req.body.tags.split(",")
  });

  sermon.save((err, sermom) => {
    if (err) res.json({ status: "error" });
    res.json({ status: "success", data: sermon });
  });
});

// Fetch online givers
router.get("/admin/giving", (req, res) => {
  Give.find({}, (err, give) => {
    if (err) res.json({ status: "error", msg: err });
    res.json({ status: "success", data: give });
  });
});

// Post Events
router.post("/admin/events", (req, res) => {
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
    if (err) res.json({ status: "error", msg: err });
    else res.json({ status: "success", data: event });
  });
});

// Delete Event
router.post("/admin/event/delete", (req, res) => {
  Events.findOneAndDelete({ _id: req.body.event }, (err, event) => {
    if (err) res.json({ status: "error", msg: err });
    res.json({ status: "success", data: event });
  });
});

// Vouchers
router.get("/admin/vouchers", (req, res) => {
  Voucher.find({}, (err, vouchers) => {
    if (err) res.json({ status: "error", data: err });
    res.json({ status: "success", data: vouchers });
  });
});

router.get("/admin/vouchers/new/:type", (req, res) => {
  // let today = moment();
  // let nextMonth = moment().add(1, 'months');
  // let expired = today.isSameOrBefore(nextMonth);
  // res.json({ today, nextMonth, expired })
  const vouchers = genVoucher.generate({
    prefix: "ROG-",
    length: 9,
    count: 200,
    charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    pattern: "###-####-##"
  });

  vouchers.forEach(voucher => {
    let vouc = new Voucher({
      code: voucher,
      expiry: moment()
        .add(req.params.type, "months")
        .toISOString(),
      type: `${req.params.type} Month`
    });

    vouc.save((err, vou) => {
      if (err) res.json({ status: "error" });
    });
  });

  res.json({ status: "success" });
});

// Fetch all attendance
router.get("/admin/attendance", (req, res) => {
  Attendance.find({}, (err, attn) => {
    if (err) res.json({ status: "error", msg: err });
    res.json({ status: "success", data: attn });
  });
});

// Post Attendance
router.post("/admin/attendance", (req, res) => {
  let attend = new Attendance({
    date: req.body.date,
    iosdate: new Date(req.body.date).toISOString(),
    men: req.body.men,
    women: req.body.women,
    children: req.body.children,
    summary: req.body.summary,
    serviceType: req.body.serviceType
  });

  attend.save((err, attn) => {
    if (err) res.json({ status: "error", msg: err });
    res.json({ status: "success", data: attn });
  });
});

// New Member
router.post("/admin/members", (req, res) => {
  let member = new Member({
    name: req.body.name,
    address: req.body.address || "",
    phone: req.body.phone || "",
    email: req.body.email || "",
    dob: req.body.dob,
    mdob: moment(req.body.dob, "Do MMMM"),
    department: req.body.department || ""
  });

  member.save((err, attn) => {
    if (err) res.json({ status: "error", msg: err });
    res.json({ status: "success", data: attn });
  });
});

// fetch admins
router.get("/admin/users", (req, res) => {
  Admin.find({}, (err, admins) => {
    if (err) res.json({ status: "error", msg: err });
    res.json({ status: "success", data: admins });
  });
});

// Delete admin
router.post("/admin/user/delete", (req, res) => {
  Admin.findOneAndDelete({ _id: req.body.user }, (err, admin) => {
    if (err) res.json({ status: "error", msg: err });
    res.json({ status: "success", data: admin });
  });
});

// listen (start app with node server.js) ===========
app.listen(config.port);
console.log("Dragons are alive at port " + config.port);
