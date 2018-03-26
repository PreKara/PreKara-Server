const assert = require("assert")
const request = require("request")
const index = require("../index.js")
const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient

let db
let client
let cookie
let theme

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
  it('Post Theme', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/theme",
      headers: {"Content-type": "application/json","Cookie": cookie},
      json: {"theme": "test_theme"}
    };
    request.post(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      theme = body.theme_id
      db.collection("theme").findOne({theme:"test_theme"},(err,result) => {
        assert.equal(err == null,true)
        assert.equal(result != null,true)
        done()
      })
    })
  })
  it('Delete Theme', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/theme",
      headers: {"Content-type": "application/json","Cookie": cookie},
      json: {"theme_id":theme}
    };
    request.delete(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      db.collection("theme").findOne({theme:"test_theme"},(err,result) => {
        assert.equal(err, null)
        assert.equal(result, null)
        done()
      })
    })
  })
  it('Revoke Session', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/session",
      headers: {"Content-type": "application/json","Cookie": cookie},
    };
    request.delete(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      done()
    })
  })
  it('Get Session (no auth)', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/session",
      headers: {"Content-type": "application/json","Cookie": cookie},
    };
    request.get(options,(err,res,body) => {
      assert.equal(res.statusCode,403)
      done()
    })
  })
  it('Relogin Session', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/session",
      headers: {"Content-type": "application/json","Cookie": cookie},
      json: {"server_name": "test2","password": "test"}
    };
    request.post(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      cookie = res.headers['set-cookie'][0];
      done()
    })
  })
  it('Delete Server', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/server",
      headers: {"Content-type": "application/json","Cookie": cookie},
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
  });
});

// 画像POST
// 画像取得 => ハッシュで同一性チェック
// 画像一覧取得
// 画像削除
