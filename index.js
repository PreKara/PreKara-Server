'use strict'

const
  express = require('express'),
  session = require('express-session'),
  bodyParser = require('body-parser'),
  mongodb = require('mongodb'),
  ObjectID = mongodb.ObjectID,
  MongoClient = mongodb.MongoClient,
  crypto = require('crypto'),
  multer = require('multer'),
  uniqid = require('uniqid'),
  path = require('path'),
  fs = require("fs-extra"),
  mime = require("mime"),
  app = express()

let db
let client

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'))

exports.finish = () => {
  server.close()
  client.close()
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './images/' + req.session.server_id + '/')
  },
  filename: function (req, file, cb) {
    cb(null, uniqid() + path.extname(file.originalname))
  }
})

const uploader = multer({ storage: storage, fileFilter: function (req, file, cb) {
  const ext = path.extname(file.originalname)
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png' && ext !== '.gif' && ext !== '.bmp') return cb(null,false,'not image')
  cb(null, true)
}}).single("image");

app.use(session({
  secret: 'ojimizucoffee',
  resave: false,
  saveUninitialized: false
}))

MongoClient.connect('mongodb://localhost:27017/prekara',(err,c) => {
  if(err) console.log("err")
  db = c.db('prekara');
  client = c
})

app.disable('x-powered-by')

const server = app.listen(process.env.PORT || 3000,function(){})

const base = "/api/v1"

// =====================
//        Version
// =====================

app.get("/api/",(req,res) => res.json({"version":"v1"}))

// =====================
//        Server
// =====================

// New Server

app.post(base + "/server", async (req,res) => {
  if(!req.body.hasOwnProperty("server_name") || !req.body.hasOwnProperty("password")) return res.status(405).send("Invalid parameter")

  const r1 = await (new Promise((resolve,reject) => {
    db.collection("server").findOne({server_name:req.body.server_name},(err,result) => {
      if(err)            return reject("err")
      if(result != null) return reject("notfound")
      resolve(null)
    })
  })
  ).catch((e) => e)

  if(r1 == "notfound") return res.status(409).send("Conflict")
  if(r1 == "err")       return res.status(500).send("Internal Error")

  const r2 = await (new Promise((resolve,reject) => {
    const sha512 = crypto.createHash('sha512')
    sha512.update(req.body.password)
    db.collection("server").insert({server_name: req.body.server_name, password: sha512.digest('hex')},(err,result) => {
      if(err) return reject("err")
      req.session.server_id = result.ops[0]._id
      fs.mkdirsSync('./images/' + result.ops[0]._id + '/');
      resolve(result.ops[0]._id);
    })
  })
  ).catch((e) => e)

  if(r2 == "err") return res.status(500).send("Internal Error")
  res.json({server_id: r2})
})

// Edit Server

app.put(base + "/server",async (req,res) => {
  if(!hasSession(req)) return res.status(403).send("Forbidden")
  if(!req.body.hasOwnProperty("server_name") && !req.body.hasOwnProperty("password")) return res.status(405).send("Invalid parameter")

  if(req.body.hasOwnProperty("server_name")){
    const r1 = await (new Promise((resolve,reject) => {
      db.collection("server").findOne({server_name:req.body.server_name},(err,result) => {
        if(err)            return reject("err")
        if(result != null) return reject("found")
        resolve(null)
      })
    })
    ).catch((e) => e)

    if (r1 == "found") return res.status(409).send("Conflict")
    if(r1 == "err")    return res.status(500).send("Internal Error")
  }

  if(req.body.hasOwnProperty("server_name")) {
    const r2 = await (new Promise((resolve,reject) => {
      db.collection("server").updateOne({"_id": ObjectID(req.session.server_id)},{$set: {"server_name": req.body.server_name}},(err,result) => {
        if(err) return reject("err")
        resolve(null);
      })
    })
    ).catch((e) => e);
    if(r2 == "err") return res.status(500).send("Internal Error")
  }

  if(req.body.hasOwnProperty("password")){
    const r3 = await (new Promise((resolve,reject) => {
      const sha512 = crypto.createHash('sha512')
      sha512.update(req.body.password)
      db.collection("server").updateOne({"_id": ObjectID(req.session.server_id)},{$set: {"password": sha512.digest('hex')}},(err,result) => {
        if(err) return reject("err")
        resolve(null);
      })
    })
    ).catch((e) => e)
    if(r3 == "err") return res.status(500).send("Internal Error")
  }

  res.send("success")

})

// Delete Server

app.delete(base + "/server",async (req,res) => {
  if(!hasSession(req)) return res.status(403).send("Forbidden")

  const r1 = await (new Promise((resolve,reject) => {
    db.collection("server").deleteOne({"_id": ObjectID(req.session.server_id)},(err,result) => {
      if (err) return reject("err")
      resolve(null);
    })
  })
  ).catch((e) => e)

  if (r1 == "err") return res.status(500).send("Internal Error")
  fs.removeSync('./images/' + req.session.server_id + '/');
  req.session.destroy();
  res.send("success");

})

// =====================
//        Session
// =====================

// Get Session

app.get(base + "/session",(req,res) => {
  if(!hasSession(req)) return res.status(403).send("Forbidden")
  res.json({server_id: req.session.server_id})
})

app.post(base + "/session",async (req,res) => {
  if(!req.body.hasOwnProperty("server_name") || !req.body.hasOwnProperty("password")) return res.status(405).send("Invalid parameter")

  const sha512_req = crypto.createHash('sha512')
  sha512_req.update(req.body.password)

  const r1 = await (new Promise((resolve,reject) => {
    db.collection("server").findOne({server_name:req.body.server_name},(err,result) => {
      if(err)            return reject("err")
      if(result == null) return reject("notfound")
      resolve(result)
    })
  })
  ).catch((e) => e)

  if(r1 == "notfound")                        return res.status(404).send("Not Found")
  if(r1 == "err")                             return res.status(500).send("Internal Error")
  if(r1.password != sha512_req.digest('hex')) return res.status(403).send("Forbidden")

  req.session.server_id = r1._id
  res.send("{server_id: \""+r1._id+"\"}")
})

app.delete(base + "/session",async (req,res) => {
  if(!hasSession(req)) return res.status(403).send("Forbidden")
  req.session.destroy();
  res.send("success")
})

// =====================
//        image
// =====================

app.get(base + "/image", async (req, res) => {
  if(!hasSession(req)) return res.status(403).send("Forbidden")
  if(!req.query.hasOwnProperty("image_name")) return res.status(405).send("Invalid parameter")


  if(!isExist('./images/' + req.session.server_id+ '/' + req.query.image_name)) return res.status(404).send("Not Found")

  const r1 = await (new Promise((resolve,reject) => {
    fs.readFile('./images/' + req.session.server_id+ '/' + req.query.image_name, function(err, data) {
      if(err) return reject("err")
      resolve(data)
    });
  })
  ).catch((e) => e)

  if(r1 == "err") return res.status(500).send("Internal Error")

  res.setHeader('Content-Type', mime.getType(req.query.image_name));
  res.send(r1);
  res.end();
})

app.post(base + "/image", (req, res) => {
  if(!hasSession(req)) return res.status(403).send("Forbidden")

  uploader(req,res,(err) => {
    if(err) return res.status(405).send("Invalid file");
    res.send("success")
  })
})

app.delete(base + "/image", async (req, res) => {
  if(!hasSession(req)) return res.status(403).send("Forbidden")
  if(!req.body.hasOwnProperty("image_name")) return res.status(405).send("Invalid parameter")

  if(!isExist('./images/' + req.session.server_id+ '/' + req.body.image_name)) return res.status(404).send("Not Found")
  fs.removeSync('./images/' + req.session.server_id+ '/' + req.body.image_name)

  res.send("success");
})

app.get(base + "/image/list", (req,res) => {
  if(!hasSession(req)) return res.status(403).send("Forbidden")
  fs.readdir('./images/' + req.session.server_id + '/', function(err, files){
    if (err) return res.status(500).send("Internal Error")
    return res.send(JSON.stringify(files));
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

