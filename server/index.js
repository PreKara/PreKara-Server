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
  console.log("connected");
  db = c.db('prekara');
  client = c
})

app.disable('x-powered-by')

const server = app.listen(3000,function(){
  console.log("Listen Port: " + this.address().port)
})

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

app.post(base + "/server", async (req,res) => {
  if(!req.body.hasOwnProperty("server_name") || !req.body.hasOwnProperty("password")){
    res.status(405).send("Invalid parameter")
    return
  }

  const resu = await (new Promise((resolve,reject) => {
    db.collection("server").findOne({server_name:req.body.server_name},(err,result) => {
      if(err == null && result == null)
        resolve(result)
      else
        reject("notfound")
    })
  })
  ).catch(() => "notfound")

  if (resu != null) {
    res.status(409).send("Conflict")
    return
  }

  const sha512 = crypto.createHash('sha512')
  sha512.update(req.body.password)
  db.collection("server").insert({server_name: req.body.server_name, password: sha512.digest('hex')},(err,result) => {
    console.log(result)
    req.session.server_id = result.ops[0]._id
    res.status(200).send("{server_id: "+result.ops[0]._id+"}")
  })
})

app.put(base + "/server",async (req,res) => {
  if(!hasSession(req)) {res.status(403).send("Forbidden"); return }
  if(!req.body.hasOwnProperty("server_name") && !req.body.hasOwnProperty("password")){
    res.status(405).send("Invalid parameter")
    return
  }

  if(req.body.hasOwnProperty("server_name")){
    const resu = await (new Promise((resolve,reject) => {
      db.collection("server").findOne({server_name:req.body.server_name},(err,result) => {
        if(err == null && result == null)
          resolve(result)
        else
          reject("notfound")
      })
    })
    ).catch(() => "notfound")

    if (resu != null) {
      res.status(409).send("Conflict")
      return
    }
  }

  if(req.body.hasOwnProperty("server_name")) {
    db.collection("server").updateOne({"_id": ObjectID(req.session.server_id)},{$set: {"server_name": req.body.server_name}},(err,result) => {
      console.log(err)
    })
  }

  if(req.body.hasOwnProperty("password")){
    const sha512 = crypto.createHash('sha512')
    sha512.update(req.body.password)
    db.collection("server").updateOne({"_id": ObjectID(req.session.server_id)},{$set: {"password": sha512.digest('hex')}},(err,result) => {
      
    })
  }

  res.send("success")

})

app.get(base + "/session",(req,res) => {
  if(!hasSession(req)) {res.status(403).send("Forbidden"); return }
  res.send({server_id: req.session.server_id})
})

function hasSession(req){
  return req.session.hasOwnProperty("server_id")
}
