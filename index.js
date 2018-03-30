'use strict'

const
  express = require('express'),
  express_session = require('express-session'),
  bodyParser = require('body-parser'),
  mongodb = require('mongodb'),
  mongojs = require('mongojs'),
  ObjectID = mongodb.ObjectID,
  MongoClient = mongodb.MongoClient,
  crypto = require('crypto'),
  multer = require('multer'),
  uniqid = require('uniqid'),
  path = require('path'),
  fs = require("fs-extra"),
  mime = require("mime"),
  app = express()

const base = "/api/v1"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './images/' + req.session.server_id + '/')
  },
  filename: function (req, file, cb) {
    req.uniqid = uniqid() + path.extname(file.originalname)
    cb(null, req.uniqid)
  }
})

const uploader = multer({ storage: storage, fileFilter: function (req, file, cb) {
  const ext = path.extname(file.originalname)
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png' && ext !== '.gif' && ext !== '.bmp') return cb(null,false,'not image')
  cb(null, true)
}}).single("image");


exports.finish = () => {
  s.close()
  mdb.close()
}

const mdb = mongojs('prekara', ['server'])

app.disable('x-powered-by')
app.use(express_session({secret: 'ojimizucoffee', resave: false, saveUninitialized: false}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'))

const s = app.listen(process.env.PORT || 3000,function(){})

const server = require('./routes/server')(mdb),
  session = require('./routes/session')(mdb),
  theme = require('./routes/theme')(mdb),
  image = require('./routes/image')(uploader)

app.use(base + "/server",server)
app.use(base + "/session",session)
app.use(base + "/theme",theme)
app.use(base + "/image",image)

app.get("/api/",(req,res) => res.json({result:"ok",status:200,version:"v1"}))
