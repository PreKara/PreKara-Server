const
router = require('express').Router(),
  fs = require("fs-extra"),
  mongojs = require('mongojs'),
  ObjectID = mongojs.ObjectID,
  tool = require("../tool")

module.exports = (db,io) => {
  router.get("/new",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})

    let server = await (new Promise((resolve,reject) => {
      db.server.findOne({_id: ObjectID(req.session.server_id)},(err,result) => {
        console.log(result)
        resolve(result)
      })
    })
    ).catch((e) => e)

    var data = {}
    if(server.countt) data.theme = server.theme[--server.countt]
    if(server.countp) data.presenter = server.presenter[--server.countp]

    io.sockets.in(req.session.server_name).emit("new",data)
    //////////////////////////////////////////
    if(server.countt === 0){
      db.server.update({_id: ObjectID(req.session.server_id)},{$set: {"countt": server.theme.length}},{multi: false},(err,res) => {
        if (err) console.log(err)
      })
      tool.themeShuffle(req,db)
    }else if(server.countt > 0){
      db.server.update({_id: ObjectID(req.session.server_id)},{$set: {"countt": server.countt}},{multi: false},(err,res) => {
        if (err) console.log(err)
      })
    }
    if(server.countp === 0){
      db.server.update({_id: ObjectID(req.session.server_id)},{$set: {"countp": server.presenter.length}},{multi: false},(err,res) => {
        if (err) console.log(err)
      })
    }else if(server.countp > 0){
      db.server.update({_id: ObjectID(req.session.server_id)},{$set: {"countp": server.countp}},{multi: false},(err,res) => {
        if (err) console.log(err)
      })
    }

    db.server.update({_id: ObjectID(req.session.server_id)},{$set: {"fin": -1}},{multi: false},(err,res) => {
      if (err) console.log(err)
    })

    res.json({result: "ok",status:200})
  })


  router.get("/next",async (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})

    let server = await (new Promise((resolve,reject) => {
      db.server.findOne({_id: ObjectID(req.session.server_id)},(err,result) => {
        if (err) console.log(err)
        resolve(result)
      })
    })
    ).catch((e) => e)

    if(!server.fin) return res.status(405).json({result:"err",status:405,err:"slide is finished"})

    server.countf--
    if (server.countf >= 0) io.sockets.in(req.session.server_name).emit("next", server.files[server.countf])
    console.log(server.countf)

    if (server.countf === 0) {
      tool.imageShuffle(req,db)
      server.countf = server.files.length - 1
      if(server.countf === 0) return res.status(500).send("not found image")
    }


    console.log("fin: " + server.fin)
    if(server.fin === -1){
      server.fin = Math.round(new Date().getTime() / 1000) + 180
      db.server.update({_id: ObjectID(req.session.server_id)},{$set: {"fin": server.fin }},{multi: false},(err,res) => {
        if (err) console.log(err)
      })
      setTimeout(() => {
        io.sockets.in(req.session.server_name).emit("stop", "stop");
        db.server.update({_id: ObjectID(req.session.server_id)},{$set: {"fin": null }},{multi: false},(err,res) => {
          if (err) console.log(err)
        })
      },180000)
    }

    db.server.update({_id: ObjectID(req.session.server_id)},{$set: {"countf": server.countf }},{multi: false},(err,res) => {
      if (err) console.log(err)
    })
    res.json({result: "ok",status:200,fin:server.fin})
  })

  return router
}
