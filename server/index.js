'use strict'

const
  config = require('config'),
  express = require('express'),
  session = require('express-session'),
  bodyParser = require('body-parser'),
  mongodb = require('mongodb'),
  MongoClient = mongodb.MongoClient,
  crypto = require('crypto'),
  sha512 = crypto.createHash('sha512'),
  app = express()

let db

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: 'ojimizucoffee',
  resave: false,
  saveUninitialized: false,
}))

MongoClient.connect('mongodb://localhost:27017/prekara',(err,client) => {
  if(err) console.log("err")
  console.log("connected");
  db = client.db('prekara');
})

app.disable('x-powered-by')

app.listen(3000,function(){
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

app.post(base + "/server",(req,res) => {
  if(!req.body.hasOwnProperty("server_name")){
    res.status(405).send("Invalid input")
    return
  }
  if(!req.body.hasOwnProperty("password")){
    res.status(405).send("Invalid input")
    return
  }

  let flag = false
  db.collection("server").find({server_name:req.body.server_name},(err,result) => {
    console.log(result)
    res.status(409).send("Conflict")
    flag = true
  })

  if (flag) return
  // session
  sha512.update(req.body.password)
  db.collection("server").insert({server_name: req.body.server_name, password: sha512.digest('hex')},(err,result) => {
    console.log(result)
    res.status(200).send("{server_id: "+result.ops[0]._id+"}")
  })
})

app.put(base + "/server",(req,res) => {
  
})
