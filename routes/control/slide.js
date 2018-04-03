const
  router = require('express').Router(),
  mongojs = require('mongojs'),
  ObjectID = mongojs.ObjectID,
  tool = require("../../tool")

module.exports = (db) => {
  router.get("/start",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    res.json({result: "ok",status:200})
  })

  router.get("/stop",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    res.json({result: "ok",status:200})
  })

  return router
}
