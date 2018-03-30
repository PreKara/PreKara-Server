const
  router = require('express').Router(),
  mongojs = require('mongojs'),
  ObjectID = mongojs.ObjectID,
  crypto = require('crypto'),
  fs = require("fs-extra"),
  tool = require("../tool")

module.exports = (db) => {
  router.get("/",(req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    res.json({result:"ok",status:200,server_id: req.session.server_id})
  })

  router.post("/",async (req,res) => {
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

  router.delete("/",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    req.session.destroy();
    res.json({result:"ok",status:200})
  })
  return router
}
