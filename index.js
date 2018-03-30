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
    req.uniqid = uniqid() + path.extname(file.originalname)
    cb(null, req.uniqid)
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

app.get("/api/",(req,res) => res.json({result:"ok",status:200,version:"v1"}))

// =====================
//        Server
// =====================

// New Server

app.post(base + "/server", async (req,res) => {
  if(!req.body.hasOwnProperty("server_name") || !req.body.hasOwnProperty("password")) return res.status(405).json({result:"err",status:405, err:"invalid parameter"})

  const r1 = await (new Promise((resolve,reject) => {
    db.collection("server").findOne({server_name:req.body.server_name},(err,result) => {
      if(err)            return reject("err")
      if(result != null) return reject("found")
      resolve(null)
    })
  })
  ).catch((e) => e)

  if(r1 == "found") return res.status(409).json({result: "err",status:409,err: "conflict"})
  if(r1 == "err")       return res.status(500).json({result: "err",status:500 , err: "internal error"})

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

  if(r2 == "err") return res.status(500).json({result: "err",status:500, err:"internal error"})
  res.json({result:"ok",status:200,server_id: r2})
})

// Edit Server

app.put(base + "/server",async (req,res) => {
  if(!hasSession(req)) return res.status(403).json({result:"err",status:403, err:"forbidden"})
  if(!req.body.hasOwnProperty("server_name") && !req.body.hasOwnProperty("password")) return res.status(405).json({result: "err",status:405,err: "invalid parameter"})

  if(req.body.hasOwnProperty("server_name")){
    const r1 = await (new Promise((resolve,reject) => {
      db.collection("server").findOne({server_name:req.body.server_name},(err,result) => {
        if(err)            return reject("err")
        if(result != null) return reject("found")
        resolve(null)
      })
    })
    ).catch((e) => e)

    if (r1 == "found") return res.status(409).json({result:"err",status:409, err:"conflict"})
    if (r1 == "err")    return res.status(500).json({result:"err",status:500, err:"internal error"})
  }

  if(req.body.hasOwnProperty("server_name")) {
    const r2 = await (new Promise((resolve,reject) => {
      db.collection("server").updateOne({"_id": ObjectID(req.session.server_id)},{$set: {"server_name": req.body.server_name}},(err,result) => {
        if(err) return reject("err")
        resolve(null);
      })
    })
    ).catch((e) => e);
    if(r2 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
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
    if(r3 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
  }

  res.json({result:"ok",status:200})

})

// Delete Server

app.delete(base + "/server",async (req,res) => {
  if(!hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})

  const r1 = await (new Promise((resolve,reject) => {
    db.collection("server").deleteOne({"_id": ObjectID(req.session.server_id)},(err,result) => {
      if (err) return reject("err")
      resolve(null);
    })
  })
  ).catch((e) => e)

  if (r1 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
  fs.removeSync('./images/' + req.session.server_id + '/');
  req.session.destroy();
  res.json({result:"ok",status:200});

})

// =====================
//        Session
// =====================

// Get Session

app.get(base + "/session",(req,res) => {
  if(!hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
  res.json({result:"ok",status:200,server_id: req.session.server_id})
})

app.post(base + "/session",async (req,res) => {
  if(!req.body.hasOwnProperty("server_name") || !req.body.hasOwnProperty("password")) return res.status(405).json({result:"err",status:405,err:"invalid parameter"})

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

  if(r1 == "notfound")                        return res.status(404).json({result:"err",status:404,err:"not found"})
  if(r1 == "err")                             return res.status(500).json({result:"err",status:500,err:"internal error"})
  if(r1.password != sha512_req.digest('hex')) return res.status(403).json({result:"err",status:403,err:"forbidden"})

  req.session.server_id = r1._id
  res.json({result:"ok",status:200,server_id: r1._id})
})

app.delete(base + "/session",async (req,res) => {
  if(!hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
  req.session.destroy();
  res.json({result:"ok",status:200})
})

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

