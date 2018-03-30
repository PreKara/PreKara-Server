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


let db
let c

exports.finish = () => {
  s.close()
  c.close()
  mdb.close()
}

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

MongoClient.connect('mongodb://localhost:27017/prekara',(err,client) => {
  if(err) console.log("err")
  db = client.db('prekara');
  c = client
})

const mdb = mongojs('prekara', ['server'])

app.disable('x-powered-by')
app.use(express_session({secret: 'ojimizucoffee', resave: false, saveUninitialized: false}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'))

const s = app.listen(process.env.PORT || 3000,function(){})


// =====================
//        Version
// =====================

app.get("/api/",(req,res) => res.json({result:"ok",status:200,version:"v1"}))

// =====================
//         APIs
// =====================

const server = require('./routes/server')(mdb),
  session = require('./routes/session')(mdb)

app.use(base + "/server",server)
app.use(base + "/session",session)

// =====================
//        theme
// =====================

app.post(base + "/theme",async (req,res) => {
  if(!hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
  if(!req.body.hasOwnProperty("theme")) return res.status(405).json({result:"err",status:405,err:"invalid parameter"})

  const r1 = await (new Promise((resolve,reject) => {
    db.collection("theme").findOne({theme:req.body.theme},(err,result) => {
      if(err)            return reject("err")
      if(result != null) return reject("found")
      resolve(null)
    })
  })
  ).catch((e) => e)

  if(r1 == "found") return res.status(409).json({result:"err",status:409,err:"conflict"})
  if(r1 == "err")       return res.status(500).json({result:"err",status:500,err:"internal error"})

  const r2 = await (new Promise((resolve,reject) => {
    db.collection("theme").insert({theme: req.body.theme},(err,result) => {
      if(err) return reject("err")
      resolve(result.ops[0]._id);
    })
  })
  ).catch((e) => e)

  if(r2 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
  res.json({result: "ok",status:200,theme_id: r2})
})
app.delete(base + "/theme",async (req,res) => {
  if(!hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
  if(!req.body.hasOwnProperty("theme_id")) return res.status(405).json({result:"err",status:405,err:"invalid parameter"})

  const r1 = await (new Promise((resolve,reject) => {
    db.collection("theme").deleteOne({"_id": ObjectID(req.body.theme_id)},(err,result) => {
      if (err) return reject("err")
      resolve(null);
    })
  })
  ).catch((e) => e)

  if (r1 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
  res.json({result:"ok",status:200})
})

app.get(base + "/theme/list",async (req,res) => {
  if(!hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})

  const r1 = await (new Promise((resolve,reject) => {
    db.collection("theme").find().toArray((err,result) => {
      if (err) return reject("err")
      resolve(result);
    })
  })
  ).catch((e) => e)

  if (r1 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
  res.json({result: "ok",status:200,list: r1})
})


// =====================
//        image
// =====================

app.get(base + "/image", async (req, res) => {
  if(!hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
  if(!req.query.hasOwnProperty("image_id")) return res.status(405).json({result:"err",status:405,err:"invalid parameter"})

  if(!isExist('./images/' + req.session.server_id+ '/' + req.query.image_id)) return res.status(404).json({result:"err",status:400,err:"not found"})

  const r1 = await (new Promise((resolve,reject) => {
    fs.readFile('./images/' + req.session.server_id+ '/' + req.query.image_id, function(err, data) {
      if(err) return reject("err")
      resolve(data)
    });
  })
  ).catch((e) => e)

  if(r1 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})

  res.setHeader('Content-Type', mime.getType(req.query.image_id));
  res.send(r1);
  res.end();
})

app.post(base + "/image", (req, res) => {
  if(!hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
  uploader(req,res,(err) => {
    if(err) return res.status(405).json({result:"err",status:405,err:"invalid file"})
    if(!req.hasOwnProperty("uniqid")) return res.json({result: "err",status: 405,err:"invalid file"})
    res.json({result: "ok",status:200,image_id: req.uniqid})
  })
})

app.delete(base + "/image", async (req, res) => {
  if(!hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
  if(!req.body.hasOwnProperty("image_id")) return res.status(405).json({result:"err",status:405,err:"invalid parameter"})

  if(!isExist('./images/' + req.session.server_id+ '/' + req.body.image_id)) return res.status(404).json({result:"err",status:404,err:"not found"})
  fs.removeSync('./images/' + req.session.server_id+ '/' + req.body.image_id)

  res.json({result:"ok",status:200})
})

app.get(base + "/image/list", (req,res) => {
  if(!hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
  fs.readdir('./images/' + req.session.server_id + '/', function(err, files){
    if (err) return res.status(500).json({result:"err",status:500,err:"internal error"})
    return res.json({result:"ok",status:200,images: files});
  });
})

function hasSession(req){
  return req.session.hasOwnProperty("server_id")
}

function isExist(file) {
  try {
    fs.statSync(file);
    return true
  } catch(err) {
    if(err.code === 'ENOENT') return false
  }
}

