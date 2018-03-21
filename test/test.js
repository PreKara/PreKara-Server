const assert = require("assert")
const request = require("request")
const index = require("../index.js")
const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient

let db
let client
let cookie

MongoClient.connect('mongodb://localhost:27017/prekara',(err,c) => {
  if(err) console.log("err")
  db = c.db('prekara');
  client = c
})

describe('DB', function() {
  this.timeout(5000);
  it('New Server', function (done) {
    setTimeout(() => {
      var options = {
        uri: "http://localhost:3000/api/v1/server",
        headers: {"Content-type": "application/json"},
        json: {"server_name": "test1","password": "test"}
      };
      request.post(options,(err,res,body) => {
        assert.equal(res.statusCode,200)
        cookie = res.headers['set-cookie'][0];
        db.collection("server").findOne({server_name:"test1"},(err,result) => {
          assert.equal(err == null,true)
          assert.equal(result != null,true)
          done()
        })
      })
    }, 1000);
  });
  it('Edit Server', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/server",
      headers: {"Content-type": "application/json","Cookie": cookie},
      json: {"server_name": "test2"}
    };
    request.put(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      db.collection("server").findOne({server_name:"test2"},(err,result) => {
        assert.equal(err == null,true)
        assert.equal(result != null,true)
        done()
      })
    })
  })
  it('Get Session', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/session",
      headers: {"Content-type": "application/json","Cookie": cookie},
    };
    request.get(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      done()
    })
  })
  // logout
  // relogin
  it('Delete Server', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/server",
      headers: {"Content-type": "application/json","Cookie": cookie}
    };
    request.delete(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      db.collection("server").findOne({server_name:"test2"},(err,result) => {
        assert.equal(err == null,true)
        assert.equal(result == null,true)
        done()
      })
    })
  })
  after(function() {
    client.close()
    index.finish()
    // runs after all tests in this block
  });
});