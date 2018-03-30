const
  router = require('express').Router(),
  mongojs = require('mongojs'),
  ObjectID = mongojs.ObjectID,
  crypto = require('crypto'),
  fs = require("fs-extra"),
  tool = require("../tool")

module.exports = (db) => {
  router.post("/", async (req,res) => {
    if(!req.body.hasOwnProperty("server_name") || !req.body.hasOwnProperty("password")) return res.status(405).json({result:"err",status:405, err:"invalid parameter"})

    const r1 = await (new Promise((resolve,reject) => {
      db.server.findOne({server_name:req.body.server_name},(err,result) => {
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
      db.server.insert({server_name: req.body.server_name, password: sha512.digest('hex')},(err,result) => {
        if(err) return reject("err")
        req.session.server_id = result._id
        fs.mkdirsSync('./images/' + result._id + '/');
        resolve(result._id);
        })
    })
    ).catch((e) => e)

    if(r2 == "err") return res.status(500).json({result: "err",status:500, err:"internal error"})
    res.json({result:"ok",status:200,server_id: r2})
  })

  router.put("/",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403, err:"forbidden"})
    if(!req.body.hasOwnProperty("server_name") && !req.body.hasOwnProperty("password")) return res.status(405).json({result: "err",status:405,err: "invalid parameter"})

    if(req.body.hasOwnProperty("server_name")){
      const r1 = await (new Promise((resolve,reject) => {
        db.server.findOne({server_name:req.body.server_name},(err,result) => {
          if(err)            return reject("err")
          if(result != null) return reject("found")
          resolve(null)
        })
      })
      ).catch((e) => e)

      if (r1 == "found")  return res.status(409).json({result:"err",status:409, err:"conflict"})
      if (r1 == "err")    return res.status(500).json({result:"err",status:500, err:"internal error"})
    }

    if(req.body.hasOwnProperty("server_name")) {
      const r2 = await (new Promise((resolve,reject) => {
        db.server.update({"_id": ObjectID(req.session.server_id)},{$set: {"server_name": req.body.server_name}},{multi: false},(err,res) => {
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
        db.server.update({"_id": ObjectID(req.session.server_id)},{$set: {"password": sha512.digest('hex')}},{multi: false},(err,result) => {
          if(err) return reject("err")
          resolve(null);
        })
      })
      ).catch((e) => e)
      if(r3 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
    }

    res.json({result:"ok",status:200})

  })

  router.delete("/",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})

    const r1 = await (new Promise((resolve,reject) => {
      db.server.remove({"_id": ObjectID(req.session.server_id)},{multi: false},(err,result) => {
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

  return router
}
