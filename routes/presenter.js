const
  router = require('express').Router(),
  mongojs = require('mongojs'),
  ObjectID = mongojs.ObjectID,
  tool = require("../tool")

module.exports = (db) => {
  router.post("/",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    if(!req.body.hasOwnProperty("presenter")) return res.status(405).json({result:"err",status:405,err:"invalid parameter"})

    const r1 = await (new Promise((resolve,reject) => {
      db.server.findOne({_id:ObjectID(req.session.server_id)},(err,result) => {
        p = result.presenter || []
        if(err)                             return reject("err")
        if(p.indexOf(req.body.presenter) != -1) return reject("found")
        p.push(req.body.presenter)
        result.presenter = p
        result.countp = p.length
        resolve(result)
      })
    })
    ).catch((e) => e)

    if(r1 == "found") return res.status(409).json({result:"err",status:409,err:"conflict"})
    if(r1 == "err")   return res.status(500).json({result:"err",status:500,err:"internal error"})

    const r2 = await (new Promise((resolve,reject) => {
      db.server.update({_id:ObjectID(req.session.server_id)},r1,(err,result) => {
        if(err) return reject("err")
        resolve(null);
      })
    })
    ).catch((e) => e)

    if(r2 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
    res.json({result: "ok",status:200})
  })

  router.delete("/",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    if(!req.body.hasOwnProperty("presenter")) return res.status(405).json({result:"err",status:405,err:"invalid parameter"})

    const r1 = await (new Promise((resolve,reject) => {
      db.server.findOne({_id:ObjectID(req.session.server_id)},(err,result) => {
        p = result.presenter || []
        if(err)                             return reject("err")
        if(p.indexOf(req.body.presenter) == -1) return reject("notfound")
        p = p.filter((l) => {
          return l != req.body.presenter
        })

        result.presenter = p
        result.countp = p.length
        resolve(result)
      })
    })
    ).catch((e) => e)

    if(r1 == "notfound") return res.status(409).json({result:"err",status:404,err:"not found"})
    if(r1 == "err")   return res.status(500).json({result:"err",status:500,err:"internal error"})

    const r2 = await (new Promise((resolve,reject) => {
      db.server.update({_id:ObjectID(req.session.server_id)},r1,(err,result) => {
        if(err) return reject("err")
        resolve(null);
      })
    })
    ).catch((e) => e)

    if(r2 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
    res.json({result: "ok",status:200})
  })

  router.get("/list",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})

    const r1 = await (new Promise((resolve,reject) => {
      db.server.findOne({_id:ObjectID(req.session.server_id)},(err,result) => {
        if(err) return reject("err")
        resolve(result.presenter || [])
      })
    })
    ).catch((e) => e)

    if (r1 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})
    res.json({result: "ok",status:200,presenter: r1})
  })

  return router
}
