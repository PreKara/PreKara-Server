const assert = require("assert")
const request = require("request")
const index = require("../index.js")
const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient

let db
let client

MongoClient.connect('mongodb://localhost:27017/prekara',(err,c) => {
  if(err) console.log("err")
  console.log("connected");
  db = c.db('prekara');
  client = c
})


describe('server', function() {
  it('New Server', function (done) {
    setTimeout(() => {
      var options = {
        uri: "http://localhost:3000/api/v1/server",
        headers: {"Content-type": "application/json"},
        json: {"server_name": "test1","password": "test"}
      };
      request.post(options,(err,res,body) => {
        console.log(err)
        console.log(body)
        db.collection("server").findOne({server_name:"test1"},(err,result) => {
          assert.equal(err == null,true)
          assert.equal(result != null,true)
          done()
        })
      })
    }, 1000);
  });
  after(function() {
    client.close()
    index.finish()
    // runs after all tests in this block
  });
});

