const assert = require("assert")
const request = require("request")
const index = require("../index.js")
const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient
const mongojs = require('mongojs')
const fs = require("fs-extra")
const hashFile = require('hash-file');

const mdb = mongojs('prekara',['server'])

let db
let client
let cookie
let image_id

MongoClient.connect('mongodb://localhost:27017/prekara',(err,c) => {
  if(err) console.log("err")
  db = c.db('prekara');
  client = c
})

describe('DB', function() {
  this.timeout(5000)
  it('New Server', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/server",
      headers: {"Content-type": "application/json"},
      json: {"server_name": "test1","password": "test"}
    };
    request.post(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      assert.equal(err,null)
      cookie = res.headers['set-cookie'][0];
      mdb.server.findOne({server_name:"test1"},(err,result) => {
        assert.equal(err, null)
        assert.equal(result != null,true)
        done()
      })
    })
  });
  it('Edit Server', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/server",
      headers: {"Content-type": "application/json","Cookie": cookie},
      json: {"server_name": "test2"}
    };
    request.put(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      assert.equal(err,null)
      mdb.server.findOne({server_name:"test2"},(err,result) => {
        assert.equal(err, null)
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
      assert.equal(err,null)
      mdb.server.findOne({server_name:"test2"},(err,result) => {
        assert.equal(err, null)
        assert.equal(result != null,true)
        assert.equal(result.theme[0],"test_theme")
        done()
      })
    })
  })
  it('Get Theme List', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/theme/list",
      headers: {"Content-type": "application/json","Cookie": cookie},
    };
    request.get(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      assert.equal(err,null)
      assert.equal(JSON.parse(body).theme[0],"test_theme")
      done()
    })
  })
  it('Delete Theme', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/theme",
      headers: {"Content-type": "application/json","Cookie": cookie},
      json: {"theme":"test_theme"}
    };
    request.delete(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      assert.equal(err,null)
      mdb.server.findOne({server_name:"test2"},(err,result) => {
        assert.equal(err, null)
        assert.equal(result != null,true)
        assert.equal(result.theme.length, 0)
        done()
      })
    })
  })
  it('Get Theme List (no theme)', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/theme/list",
      headers: {"Content-type": "application/json","Cookie": cookie},
    };
    request.get(options,(err,res,body) => {
      assert.equal(err,null)
      assert.equal(res.statusCode,200)
      assert.equal(JSON.parse(body).theme.length,0)
      done()
    })
  })
  it('Post Presenter', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/presenter",
      headers: {"Content-type": "application/json","Cookie": cookie},
      json: {"presenter": "test_presenter"}
    };
    request.post(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      assert.equal(err,null)
      mdb.server.findOne({server_name:"test2"},(err,result) => {
        assert.equal(err, null)
        assert.equal(result != null,true)
        assert.equal(result.presenter[0],"test_presenter")
        done()
      })
    })
  })
  it('Get Theme Presenter', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/presenter/list",
      headers: {"Content-type": "application/json","Cookie": cookie},
    };
    request.get(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      assert.equal(err,null)
      assert.equal(JSON.parse(body).presenter[0],"test_presenter")
      done()
    })
  })
  it('Delete Presenter', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/presenter",
      headers: {"Content-type": "application/json","Cookie": cookie},
      json: {"presenter":"test_presenter"}
    };
    request.delete(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      assert.equal(err,null)
      mdb.server.findOne({server_name:"test2"},(err,result) => {
        assert.equal(err, null)
        assert.equal(result != null,true)
        assert.equal(result.presenter.length, 0)
        done()
      })
    })
  })
  it('Get Presenter List (no presenter)', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/presenter/list",
      headers: {"Content-type": "application/json","Cookie": cookie},
    };
    request.get(options,(err,res,body) => {
      assert.equal(err,null)
      assert.equal(res.statusCode,200)
      assert.equal(JSON.parse(body).presenter.length,0)
      done()
    })
  })
  it('Post Image', function (done) {
    request.get("https://raw.githubusercontent.com/KawakawaRitsuki/Image/master/PreKara-banner-server.png", {encoding: 'binary'}, function(error, response, body) {
      fs.writeFile('image.png', body, 'binary', function (err) {
        assert.equal(err,null)
        var formData = {
          image: {
            value:  fs.createReadStream('./image.png'),
            options: {
              filename: 'image.png',
              contentType: 'image/png'
            }
          }
        };
        request.post({url:'http://localhost:3000/api/v1/image', formData: formData,headers: {"Cookie": cookie}}, function optionalCallback(err2, res, bod) {
          assert.equal(err2,null)
          assert.equal(res.statusCode,200)
          image_id = JSON.parse(bod).image_id
          done()
        });
      })
    })
  })
  it('Get Image',function (done) {
    request.get("http://localhost:3000/api/v1/image?image_id=" + image_id, {encoding: 'binary',headers: {"Cookie": cookie}}, function(error, response, body) {
      assert.equal(response.statusCode,200)
      fs.writeFile('image2.png', body, 'binary', function (err) {
        assert.equal(err,null)
        assert.equal(hashFile.sync('./image.png'),hashFile.sync('./image.png'))
        fs.removeSync('./image.png')
        fs.removeSync('./image2.png')
        done()
      });
    });
  })
  it('Get Image List',function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/image/list",
      headers: {"Content-type": "application/json","Cookie": cookie},
    };
    request.get(options,(err,res,body) => {
      assert.equal(err,null)
      assert.equal(res.statusCode,200)
      assert.equal(JSON.parse(body).images.length,1)
      done()
    })
  })
  it('Delete Image', function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/image",
      headers: {"Content-type": "application/json","Cookie": cookie},
      json: {"image_id":image_id}
    };
    request.delete(options,(err,res,body) => {
      assert.equal(res.statusCode,200)
      done()
    })
  })
  it('Get Image List (no image)',function (done) {
    var options = {
      uri: "http://localhost:3000/api/v1/image/list",
      headers: {"Content-type": "application/json","Cookie": cookie},
    };
    request.get(options,(err,res,body) => {
      assert.equal(err,null)
      assert.equal(res.statusCode,200)
      assert.equal(JSON.parse(body).images.length,0)
      done()
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
      mdb.server.findOne({server_name:"test2"},(err,result) => {
        assert.equal(err,null)
        assert.equal(result,null)
        done()
      })
    })
  })
  after(function() {
    mdb.close()
    client.close()
    index.finish()
  });
});

