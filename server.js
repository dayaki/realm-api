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

router.get("/cw/vouchers", (req, res) => {
  // const vouchers = ["CW19-Q963-J8E6","CW19-HIUI-6A17","CW19-R42C-EB3A","CW19-7AHI-72KY","CW19-A87C-IE5Y","CW19-TEGV-1NZF","CW19-L3KW-HLSJ","CW19-5BCH-ZDIP","CW19-7VJ7-AZSC","CW19-SWKK-TNHE","CW19-Y7SD-UVWQ","CW19-NPRU-RHYY","CW19-6V5F-U6YS","CW19-YWZ3-61P5","CW19-US3Z-5LPL","CW19-VXYJ-IYN1","CW19-DK7P-8VD3","CW19-J5LD-GUUL","CW19-AFW5-8NT3","CW19-T8HW-SF19","CW19-8JQ8-SSPK","CW19-EL45-8RBN","CW19-JYJI-GT46","CW19-HVLV-QLUX","CW19-4GH8-7S47","CW19-564B-45WJ","CW19-84TG-HV88","CW19-FLMJ-MZZK","CW19-YJ2M-3MJN","CW19-DBU6-94HT","CW19-GBSM-ZFLD","CW19-8WMU-KDID","CW19-W84C-WYZE","CW19-MJU4-HKLG","CW19-B52E-XQIH","CW19-GZ47-PTXJ","CW19-FTPM-I5YS","CW19-ANMX-XR7Q","CW19-W5M5-D7LK","CW19-4FHY-PNAL","CW19-65QY-59CS","CW19-2UCJ-K1G3","CW19-PV4G-SNQI","CW19-M6A2-BP1C","CW19-EBH6-EHXE","CW19-XZ4W-U6ML","CW19-B18Y-WWQZ","CW19-CMB7-ZJSN","CW19-XIZ6-CK6K","CW19-EMEE-ESW7","CW19-HRJE-PL31","CW19-SI79-6J8G","CW19-RVEY-YH3U","CW19-4GDD-ZAYX","CW19-YBJI-6BBJ","CW19-AZWL-JSXS","CW19-HWCG-7HKL","CW19-1QEJ-UFS2","CW19-CFSS-36JV","CW19-AFQH-HQD4","CW19-EVRI-1H6L","CW19-GZ7N-PLMR","CW19-EAFS-M7G9","CW19-K3CQ-WWLI","CW19-KP1H-HVYB","CW19-UT3N-DK6L","CW19-1LQC-YCD9","CW19-CLEE-XMYZ","CW19-BNG2-8CEF","CW19-HTUZ-P82E","CW19-RZFN-K1LN","CW19-MFZ4-AM5L","CW19-RGE7-S2EY","CW19-3PWC-LQTA","CW19-HD4D-I541","CW19-PZHL-F8KV","CW19-RRHC-JWV5","CW19-2SVF-HBK7","CW19-YI71-ZCNI","CW19-XE4N-CRAU","CW19-26R5-WEHY","CW19-4CJC-53IH","CW19-IC6R-XMC7","CW19-SBEN-R662","CW19-D9GD-CYI6","CW19-1MX4-PRRU","CW19-36UB-TFIU","CW19-6L76-SC9P","CW19-YLXZ-73EE","CW19-N7VE-ZH23","CW19-EDK9-KW8A","CW19-MWUM-NPSV","CW19-7L59-8AS8","CW19-PPU4-NL7D","CW19-FZMX-XHKR","CW19-1BSU-YQCY","CW19-Q8S5-B6P2","CW19-KQ9S-HKZN","CW19-X7R5-9ZB7","CW19-2XP1-4BW7"];
  const vouchers = [
    { code: "CW19-Q963-J8E6" },
    { code: "CW19-HIUI-6A17" },
    { code: "CW19-R42C-EB3A" },
    { code: "CW19-7AHI-72KY" },
    { code: "CW19-A87C-IE5Y" },
    { code: "CW19-TEGV-1NZF" },
    { code: "CW19-L3KW-HLSJ" },
    { code: "CW19-5BCH-ZDIP" },
    { code: "CW19-7VJ7-AZSC" },
    { code: "CW19-SWKK-TNHE" },
    { code: "CW19-Y7SD-UVWQ" },
    { code: "CW19-NPRU-RHYY" },
    { code: "CW19-6V5F-U6YS" },
    { code: "CW19-YWZ3-61P5" },
    { code: "CW19-US3Z-5LPL" },
    { code: "CW19-VXYJ-IYN1" },
    { code: "CW19-DK7P-8VD3" },
    { code: "CW19-J5LD-GUUL" },
    { code: "CW19-AFW5-8NT3" },
    { code: "CW19-T8HW-SF19" },
    { code: "CW19-8JQ8-SSPK" },
    { code: "CW19-EL45-8RBN" },
    { code: "CW19-JYJI-GT46" },
    { code: "CW19-HVLV-QLUX" },
    { code: "CW19-4GH8-7S47" },
    { code: "CW19-564B-45WJ" },
    { code: "CW19-84TG-HV88" },
    { code: "CW19-FLMJ-MZZK" },
    { code: "CW19-YJ2M-3MJN" },
    { code: "CW19-DBU6-94HT" },
    { code: "CW19-GBSM-ZFLD" },
    { code: "CW19-8WMU-KDID" },
    { code: "CW19-W84C-WYZE" },
    { code: "CW19-MJU4-HKLG" },
    { code: "CW19-B52E-XQIH" },
    { code: "CW19-GZ47-PTXJ" },
    { code: "CW19-FTPM-I5YS" },
    { code: "CW19-ANMX-XR7Q" },
    { code: "CW19-W5M5-D7LK" },
    { code: "CW19-4FHY-PNAL" },
    { code: "CW19-65QY-59CS" },
    { code: "CW19-2UCJ-K1G3" },
    { code: "CW19-PV4G-SNQI" },
    { code: "CW19-M6A2-BP1C" },
    { code: "CW19-EBH6-EHXE" },
    { code: "CW19-XZ4W-U6ML" },
    { code: "CW19-B18Y-WWQZ" },
    { code: "CW19-CMB7-ZJSN" },
    { code: "CW19-XIZ6-CK6K" },
    { code: "CW19-EMEE-ESW7" },
    { code: "CW19-HRJE-PL31" },
    { code: "CW19-SI79-6J8G" },
    { code: "CW19-RVEY-YH3U" },
    { code: "CW19-4GDD-ZAYX" },
    { code: "CW19-YBJI-6BBJ" },
    { code: "CW19-AZWL-JSXS" },
    { code: "CW19-HWCG-7HKL" },
    { code: "CW19-1QEJ-UFS2" },
    { code: "CW19-CFSS-36JV" },
    { code: "CW19-AFQH-HQD4" },
    { code: "CW19-EVRI-1H6L" },
    { code: "CW19-GZ7N-PLMR" },
    { code: "CW19-EAFS-M7G9" },
    { code: "CW19-K3CQ-WWLI" },
    { code: "CW19-KP1H-HVYB" },
    { code: "CW19-UT3N-DK6L" },
    { code: "CW19-1LQC-YCD9" },
    { code: "CW19-CLEE-XMYZ" },
    { code: "CW19-BNG2-8CEF" },
    { code: "CW19-HTUZ-P82E" },
    { code: "CW19-RZFN-K1LN" },
    { code: "CW19-MFZ4-AM5L" },
    { code: "CW19-RGE7-S2EY" },
    { code: "CW19-3PWC-LQTA" },
    { code: "CW19-HD4D-I541" },
    { code: "CW19-PZHL-F8KV" },
    { code: "CW19-RRHC-JWV5" },
    { code: "CW19-2SVF-HBK7" },
    { code: "CW19-YI71-ZCNI" },
    { code: "CW19-XE4N-CRAU" },
    { code: "CW19-26R5-WEHY" },
    { code: "CW19-4CJC-53IH" },
    { code: "CW19-IC6R-XMC7" },
    { code: "CW19-SBEN-R662" },
    { code: "CW19-D9GD-CYI6" },
    { code: "CW19-1MX4-PRRU" },
    { code: "CW19-36UB-TFIU" },
    { code: "CW19-6L76-SC9P" },
    { code: "CW19-YLXZ-73EE" },
    { code: "CW19-N7VE-ZH23" },
    { code: "CW19-EDK9-KW8A" },
    { code: "CW19-MWUM-NPSV" },
    { code: "CW19-7L59-8AS8" },
    { code: "CW19-PPU4-NL7D" },
    { code: "CW19-FZMX-XHKR" },
    { code: "CW19-1BSU-YQCY" },
    { code: "CW19-Q8S5-B6P2" },
    { code: "CW19-KQ9S-HKZN" },
    { code: "CW19-X7R5-9ZB7" },
    { code: "CW19-2XP1-4BW7" }
  ];

  CWVoucher.insertMany(vouchers, (err, vouchers) => {
    if (err) res.json({ status: error, msg: err });

    res.json({ status: "success " });
  });
});

router.post("cw/voucher/verify", (req, res) => {
  CWVoucher.findOneAndUpdate(
    { code: req.body.voucher },
    { $set: { used: true, usage: +1 } },
    { new: true },
    (err1, voucher) => {
      if (err1) res.json({ status: "error", msg: err1 });
      res.json({ status: "success", data: voucher });
    }
  );
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
  let email = req.body.email;
  let pass = req.body.password;

  User.findOne({ email: email, isAdmin: "false" }, (err, user) => {
    if (err) res.json({ status: "error", msg: err });

    if (user === null) {
      res.json({ status: "error", msg: "User not found." });
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
