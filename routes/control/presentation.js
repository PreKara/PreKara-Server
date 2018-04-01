const
  router = require('express').Router(),
  mongojs = require('mongojs'),
  ObjectID = mongojs.ObjectID,
  tool = require("../../tool")

module.exports = (db) => {
  router.get("/",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    res.json({result: "ok",status:200})
  })

  router.get("/",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    res.json({result: "ok",status:200})
  })

  router.get("/list",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    res.json({result: "ok",status:200,theme: r1})
  })

  return router
}
