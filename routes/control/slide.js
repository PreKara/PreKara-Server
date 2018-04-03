const
router = require('express').Router(),
  fs = require("fs-extra"),
  mongojs = require('mongojs'),
  ObjectID = mongojs.ObjectID,
  tool = require("../../tool")

module.exports = (db,io) => {
  router.get("/start",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    res.json({result: "ok",status:200})
  })

  router.get("/stop",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    res.json({result: "ok",status:200})
  })

  router.get("/next",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})

    let count = await (new Promise((resolve,reject) => {
      db.server.findOne({_id: ObjectID(req.session.server_id)},(err,result) => {
        db.server.update({_id: ObjectID(req.session.server_id)},{$set: {"count": --result.count}},{multi: false},(err,res) => {
          if (err) console.log(err)
          resolve(result.count)
        })
      })
    })
    ).catch((e) => e)

    let files = await (new Promise((resolve,reject) => {
      db.server.findOne({_id: ObjectID(req.session.server_id)},(err,result) => {
        resolve(result.files)
      })
    })
    ).catch((e) => e)

    console.log(count)
    //  req.session.count--

    //tool.setDBCount(db,req.server_id,2)
    //console.log(tool.getDBCount(db,req.server_id))
    //    req.session.count


    io.sockets.in(req.session.server_name).emit("next", files[count])
    if(count === 0) {
      tool.imageShuffle(req,db)
    }
    res.json({result: "ok",status:200})
  })

  return router
}
