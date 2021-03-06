const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const genVoucher = require("voucher-code-generator");
const cors = require("cors");
const slug = require("slug");
const config = require("./config");
const moment = require("moment");
const OneSignal = require("onesignal-node");
const Email = require("emailjs");
const randomColor = require("randomcolor");
const axios = require("axios");
const cron = require("node-cron");

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
mongoose.connect(config.database, { useNewUrlParser: true });

router.get("/", (req, res) => {
  res.send("yeah it's working...");
  // sendNotification();
});

// function sendNotification() {
//   const myClient = new OneSignal.Client({
//     app: {
//       appAuthKey: "NWQwYTcxYWUtOTA5MC00NThhLThjMmItMTJiNGFmM2YxNjE4",
//       appId: "9becef96-c36d-4a85-a7be-601860a1cb70"
//     }
//   });

//   const notification = new OneSignal.Notification({
//     contents: {
//       en: "Testing Push Notification 😊"
//     },
//     included_segments: ["Engaged Users"] //Subscribed Users"]
//   });
//   notification.postBody["data"] = { details: "some info" };

//   myClient.sendNotification(notification, (err, data) => {
//     if (err) {
//       console.log(err);
//       // res.json({ status: "error", err });
//     } else {
//       // res.json({ status: "success", data });
//       console.log(data);
//     }
//   });
// }

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
        password: bcrypt.hashSync(req.body.password, saltRounds),
        onesignal: req.body.onesignal,
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

  User.findOne({ email: email }, function (err, user) {
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
        onesignal: req.body.onesignal,
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

// Forgot Password
router.post("/auth/forgotpass", (req, res) => {
  const fnPassword = Math.random().toString(36).substr(2, 8);

  User.findOneAndUpdate(
    { email: req.body.email },
    { $set: { password: bcrypt.hashSync(fnPassword, saltRounds) } },
    (err, vouc) => {
      if (err) {
        res.json({ status: "error", msg: err });
      } else {
        const server = Email.server.connect({
          user: "mailer@realmofglory.org",
          password: "realmHQ01",
          host: "host51.registrar-servers.com",
          ssl: true,
        });

        server.send(
          {
            text: req.body.message,
            from: "Realm Mailer <mailer@realmofglory.org>",
            to: req.body.email,
            subject: "Password Reset",
            attachment: [
              {
                data: `<html>
                    <div>
                      <h3>Hello there!</h3>
                      <p>Your new password is <strong>${fnPassword}</strong></p>
                      <p>If this was not at your request, then please contact the web team immediately.</p>
                      <p>Warm regards,</p>
                      <p>ROG Web Team</p>
                    </div>
                  </html>`,
                alternative: true,
              },
            ],
          },
          function (err, message) {
            if (err) res.json({ status: "Error", msg: err });
            else res.json({ status: "success", data: message });
          }
        );
      }
      res.json({ status: "success" });
    }
  );

  // User.findOne({ email: req.body.email }, (err, data) => {
  //   if (err) {
  //     res.json({ status: "error", data: err });
  //   } else {
  //     if (data === null) {
  //       res.json({ status: "error", msg: "Email address does not exist." });
  //     } else {

  //     }
  //   }
  // })
});

// User
router
  .route("/users")

  .get((req, res) => {
    User.find(function (err, users) {
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
          photo: req.body.photo,
        },
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
    author: req.body.user,
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
        content: req.body.content,
      },
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
    txn_ref: req.body.ref,
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
    type: `${req.body.type} Month`,
  });

  vouc.save((err, vouOne) => {
    if (err) res.json({ status: "error" });

    if (req.body.user !== null) {
      User.findOneAndUpdate(
        { _id: req.body.user },
        {
          $set: {
            sub_active: true,
            sub_end: moment().add(req.body.type, "months"),
          },
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
    if (err) return res.json({ status: "error", data: err });

    if (voucher === null) {
      return res.json({ status: "invalid" });
    } else {
      if (voucher.isExpired) {
        return res.json({ status: "expired" });
      }
      if (voucher.timesUsed > 10) {
        return res.json({ status: "usedup" });
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
            if (err) return res.json({ status: "error" });
            res.json({ status: "voucher", data: info });
          }
        );
      }

      // Already used voucher
      if (voucher.used) {
        // if (voucher.device !== req.body.device) {
        //   return res.json({ status: "device" });
        // }
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
              if (err1) return res.json({ status: "error", msg: err });
              if (req.body.user !== null) {
                User.findOneAndUpdate(
                  { _id: req.body.user },
                  { $set: { sub_active: false } },
                  { new: true },
                  (err, expiredUser) => {
                    if (err) {
                      return res.json({ status: "error", msg: err });
                    } else {
                      res.json({ status: "userExpired", data: expiredUser });
                    }
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
                if (err1) {
                  return res.json({ status: "error" });
                } else {
                  res.json({ status: "userSuccess", user: user });
                }
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
  Events.find()
    .sort({ created_at: -1 })
    .exec((err, events) => {
      if (err) res.json({ status: "error", msg: err });
      res.json({ status: "success", data: events });
    });
  // Events.find({}, (err, events) => {
  //   if (err) res.json({ status: "error", msg: err });
  //   else res.json({ status: "success", data: events });
  // });
});

// Support email
router.post("/support", (req, res) => {
  const server = Email.server.connect({
    user: "mailer@realmofglory.org",
    password: "realmHQ01",
    host: "host51.registrar-servers.com",
    ssl: true,
  });

  server.send(
    {
      text: req.body.message,
      from: "Realm Mailer <mailer@realmofglory.org>",
      to: "Web Team <webteam@realmofglory.org>",
      bcc: "<olasland@gmail.com>, <me@sprypixels.com>",
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
          alternative: true,
        },
      ],
    },
    function (err, message) {
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
    ssl: true,
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
          alternative: true,
        },
      ],
    },
    function (err, message) {
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
    password: bcrypt.hashSync(req.body.password, saltRounds),
    role: req.body.role,
  });

  user.save((err, user) => {
    if (err) res.json({ status: "error", data: err });
    res.json({ status: "success", data: user });
  });
});

router.post("/admin/user/password", (req, res) => {
  const password = bcrypt.hashSync(req.body.password, saltRounds);
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
    color: randomColor({ format: "rgba", alpha: 0.8, count: 1 }),
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
    tags: req.body.tags.split(","),
  });

  // newSermonNotification(req.body.title);

  sermon.save((err, sermom) => {
    if (err) res.json({ status: "error" });
    res.json({ status: "success", data: sermon });
  });
});

function newSermonNotification(title) {
  const myClient = new OneSignal.Client({
    app: {
      appAuthKey: "OTA2OTE4OWEtMTczMy00MzAyLWFkN2YtMTcwZTE3ZTUzMzJi",
      appId: "d9b7eddc-f5b2-4cdc-a295-b415f9c40674",
    },
  });
  // const myClient = new OneSignal.Client({
  //   app: {
  //     appAuthKey: "OTA2OTE4OWEtMTczMy00MzAyLWFkN2YtMTcwZTE3ZTUzMzJi",
  //     appId: "d9b7eddc-f5b2-4cdc-a295-b415f9c40674",
  //   },
  // });

  const notification = new OneSignal.Notification({
    contents: {
      en: `Latest Sermon: ${title}`,
    },
    // included_segments: ["Testers"]
    included_segments: ["Subscribed Users"],
  });
  notification.postBody["data"] = { sermon: true };
  notification.postBody["send_after"] = moment().add(1, "minutes");

  myClient.sendNotification(notification, (err, httpResponse, data) => {
    if (err) {
      console.log("Something went wrong...");
    } else {
      console.log(data, httpResponse.statusCode);
    }
  });
}

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
    time: req.body.time,
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
    pattern: "###-####-##",
  });

  vouchers.forEach((voucher) => {
    let vouc = new Voucher({
      code: voucher,
      expiry: moment().add(req.params.type, "months").toISOString(),
      type: `${req.params.type} Month`,
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
    serviceType: req.body.serviceType,
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
    department: req.body.department || "",
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

router.post("/admin/message", (req, res) => {
  const myClient = new OneSignal.Client({
    app: {
      appAuthKey: "NWQwYTcxYWUtOTA5MC00NThhLThjMmItMTJiNGFmM2YxNjE4",
      appId: "9becef96-c36d-4a85-a7be-601860a1cb70",
    },
  });

  const notification = new OneSignal.Notification({
    contents: {
      en: req.body.message,
    },
    included_segments: ["Testers"], //Subscribed Users"]
  });
  notification.postBody["data"] = { details: req.body.details };

  myClient.sendNotification(notification, (err, data) => {
    if (err) {
      res.json({ status: "error", err });
    } else {
      res.json({ status: "success", data });
      // console.log(data, httpResponse.statusCode);
    }
  });
});

router.get("/birthday/send", (req, res) => {
  // const sender = "rUPDATE";
  // const name = "Dayo Akinkuowo Emmanuel";
  // const message = `Dear ${name}, on this occasion of your birthday, may the Lord God grant you new strength for new heights. Happy birthday to you from Realm of Glory International Church, Okota, Lagos. Amen`;

  // axios
  //   .get(
  //     `http://api.ibulky.com/sendsms/?apikey=fc9f9aa5d5cff73e8c3cb14f-16d36ea&sender=${sender}&recipient=2347038263568,2347038327370&message=${message}&msgtype=text&delivery=yes`
  //   )
  //   .then(response => {
  //     // handle success
  //     console.log("success ---");
  //     console.log(response.data);
  //     res.json({ status: "success " });
  //   })
  //   .catch(function(error) {
  //     // handle error
  //     console.log("error", error);
  //     res.json({ status: "error" });
  //   })
  //   .then(function() {
  //     // always executed
  //   });
  BirthdayMessenger();
});

// Birthday SMS
function BirthdayMessenger() {
  // possible senderID = rUPDATE, INFODESK, INFINITI
  const sender = "rUPDATE";
  const demoUsers = [
    {
      name: "Bayo Adekanmbi",
      phone: "2348028862638",
    },
    {
      name: "Olamide Aiyedogbon",
      phone: "2348027426045",
    },
    {
      name: "Leslie Bapetel",
      phone: "2348068867533",
    },
    {
      name: "Dayo Akinkuowo Emmanuel",
      phone: "2347038327350",
    },
  ];

  demoUsers.forEach((user) => {
    const message = `Dear ${user.name}, on this occasion of your birthday, may the Lord God grant you new strength for new heights. Happy birthday to you from Realm of Glory International Church, Okota, Lagos.`;
    const sms = `http://api.ibulky.com/sendsms/?apikey=fc9f9aa5d5cff73e8c3cb14f-16d36ea&sender=${sender}&recipient=${user.phone}&message=${message}&msgtype=text&delivery=yes`;

    axios
      .get(sms)
      .then((response) => {
        // handle success
        console.log("success ---");
        console.log(response.data);
        res.json({ status: "success " });
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });
  });
}

// listen (start app with node server.js) ===========
app.listen(config.port);
console.log("Dragons are alive at port " + config.port);
