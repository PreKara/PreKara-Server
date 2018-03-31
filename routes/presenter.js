const
  router = require('express').Router(),
  mongojs = require('mongojs'),
  ObjectID = mongojs.ObjectID,
  tool = require("../tool")

  module.exports = (db) => {
    router.post("/",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    if(!req.body.hasOwnProperty("theme")) return res.status(405).json({result:"err",status:405,err:"invalid parameter"})

    const r1 = await (new Promise((resolve,reject) => {
      db.theme.findOne({theme:req.body.theme},(err,result) => {
        if(err)            return reject("err")
        if(result != null) return reject("found")
        resolve(null)
      })
    })
    ).catch((e) => e)

    if(r1 == "found") return res.status(409).json({result:"err",status:409,err:"conflict"})
    if(r1 == "err")       return res.status(500).json({result:"err",status:500,err:"internal error"})

    const r2 = await (new Promise((resolve,reject) => {
      db.theme.insert({theme: req.body.theme},(err,result) => {
        if(err) return reject("err")
        resolve(result._id);
      })
    })
    ).catch((e) => e)

    if(r2 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
    res.json({result: "ok",status:200,theme_id: r2})
  })

  router.delete("/",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    if(!req.body.hasOwnProperty("theme_id")) return res.status(405).json({result:"err",status:405,err:"invalid parameter"})

    const r1 = await (new Promise((resolve,reject) => {
      db.theme.remove({"_id": ObjectID(req.body.theme_id)},{multi: false},(err,result) => {
        if (err) return reject("err")
        resolve(null);
      })
    })
    ).catch((e) => e)

    if (r1 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
    res.json({result:"ok",status:200})
  })

  router.get("/list",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})

    const r1 = await (new Promise((resolve,reject) => {
      db.theme.find((err,result) => {
        if (err) return reject("err")
        resolve(result);
      })
    })
    ).catch((e) => e)

    if (r1 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
    res.json({result: "ok",status:200,list: r1})
  })

  return router
}
