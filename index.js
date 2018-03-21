'use strict'

const
  config = require('config'),
  express = require('express'),
  session = require('express-session'),
  bodyParser = require('body-parser'),
  mongodb = require('mongodb'),
  ObjectID = mongodb.ObjectID,
  MongoClient = mongodb.MongoClient,
  crypto = require('crypto'),
  app = express()

let db
let client

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

exports.finish = () => {
  server.close()
  client.close()
}

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

const server = app.listen(3000,function(){})

const base = "/api/v1"

// =====================
//        Version
// =====================

app.get("/api/",(req,res) => {
  res.send('{"version":"v1"}')
})

// =====================
//        Server
// =====================

// New Server

app.post(base + "/server", async (req,res) => {
  if(!req.body.hasOwnProperty("server_name") || !req.body.hasOwnProperty("password")){
    res.status(405).send("Invalid parameter")
    return
  }

  const r1 = await (new Promise((resolve,reject) => {
    db.collection("server").findOne({server_name:req.body.server_name},(err,result) => {
      if(err) { reject("err"); return }
      if(result == null)
        resolve(null)
      else
        reject("notfound")
    })
  })
  ).catch(() => "err")

  if (r1 == "notfound") {
    res.status(409).send("Conflict")
    return
  }else if(r1 == "err"){
    res.status(500).send("Internal Error")
    return
  }

  const r2 = await (new Promise((resolve,reject) => {
    const sha512 = crypto.createHash('sha512')
    sha512.update(req.body.password)
    db.collection("server").insert({server_name: req.body.server_name, password: sha512.digest('hex')},(err,result) => {
      if(err) { reject("err"); return }
      req.session.server_id = result.ops[0]._id
      resolve(result.ops[0]._id);
    })
  })
  ).catch(() => "err")

  if(r2 == "err"){
    res.status(500).send("Internal Error")
    return
  }else{
    res.send("{server_id: "+r2+"}")
  }
})

// Edit Server

app.put(base + "/server",async (req,res) => {
  if(!hasSession(req)) {res.status(403).send("Forbidden"); return }
  if(!req.body.hasOwnProperty("server_name") && !req.body.hasOwnProperty("password")){
    res.status(405).send("Invalid parameter")
    return
  }

  if(req.body.hasOwnProperty("server_name")){
    const r1 = await (new Promise((resolve,reject) => {
      db.collection("server").findOne({server_name:req.body.server_name},(err,result) => {
        if(err) { reject("err"); return }
        if(result == null)
          resolve(null)
        else
          reject("found")
      })
    })
    ).catch(() => "error")

    if (r1 == "found") {
      res.status(409).send("Conflict")
      return
    }else if(r1 == "err"){
      res.status(500).send("Internal Error")
      return
    }
  }

  if(req.body.hasOwnProperty("server_name")) {
    const r2 = await (new Promise((resolve,reject) => {
      db.collection("server").updateOne({"_id": ObjectID(req.session.server_id)},{$set: {"server_name": req.body.server_name}},(err,result) => {
        if(err) { reject("err"); return }
        resolve(null);
      })
    })
    ).catch(() => "err");
    if(r2 == "err"){
      res.status(500).send("Internal Error")
      return
    }
  }

  if(req.body.hasOwnProperty("password")){
    const r3 = await (new Promise((resolve,reject) => {
      const sha512 = crypto.createHash('sha512')
      sha512.update(req.body.password)
      db.collection("server").updateOne({"_id": ObjectID(req.session.server_id)},{$set: {"password": sha512.digest('hex')}},(err,result) => {
        if(err) { reject("err"); return }
        resolve(null);
      })
    })
    ).catch(() => "err")
    if(r3 == "err"){
      res.status(500).send("Internal Error")
      return
    }
  }

  res.send("success")

})

// Delete Server

app.delete(base + "/server",async (req,res) => {
  if(!hasSession(req)) {res.status(403).send("Forbidden"); return }

  const r1 = await (new Promise((resolve,reject) => {
    db.collection("server").deleteOne({"_id": ObjectID(req.session.server_id)},(err,result) => {
      if (err) { reject("error"); return }
      resolve(null);
    })
  })
  ).catch(() => "err")

  if (r1 == "err") {
    res.status(500).send("Internal Error")
    return
  }
  res.send("success");

})

// Get Session

app.get(base + "/session",(req,res) => {
  if(!hasSession(req)) {res.status(403).send("Forbidden"); return }
  res.send({server_id: req.session.server_id})
})

function hasSession(req){
  return req.session.hasOwnProperty("server_id")
}
