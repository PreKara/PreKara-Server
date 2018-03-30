const
  router = require('express').Router(),
  fs = require("fs-extra"),
  multer = require('multer'),
  uniqid = require('uniqid'),
  path = require('path'),
  mime = require("mime"),
  tool = require("../tool")

module.exports = (uploader) => {

  router.get("/", async (req, res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    if(!req.query.hasOwnProperty("image_id")) return res.status(405).json({result:"err",status:405,err:"invalid parameter"})

    if(!fs.existsSync('./images/' + req.session.server_id+ '/' + req.query.image_id)) return res.status(404).json({result:"err",status:404,err:"not found"})

    const r1 = await (new Promise((resolve,reject) => {
      fs.readFile('./images/' + req.session.server_id+ '/' + req.query.image_id, function(err, data) {
        if(err) return reject("err")
        resolve(data)
     });
    })
    ).catch((e) => e)

    if(r1 == "err") return res.status(500).json({result:"err",status:500,err:"internal error"})

    res.setHeader('Content-Type', mime.getType(req.query.image_id));
    res.send(r1);
    res.end();
  })

  router.post("/", (req, res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    uploader(req,res,(err) => {
      if(err) return res.status(405).json({result:"err",status:405,err:"invalid file"})
      if(!req.hasOwnProperty("uniqid")) return res.json({result: "err",status: 405,err:"invalid file"})
      res.json({result: "ok",status:200,image_id: req.uniqid})
    })
  })

  router.delete("/", async (req, res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
    if(!req.body.hasOwnProperty("image_id")) return res.status(405).json({result:"err",status:405,err:"invalid parameter"})

    if(!fs.existsSync('./images/' + req.session.server_id+ '/' + req.body.image_id)) return res.status(404).json({result:"err",status:404,err:"not found"})
    fs.removeSync('./images/' + req.session.server_id+ '/' + req.body.image_id)

    res.json({result:"ok",status:200})
  })

  router.get("/list", (req,res) => {
    if(!tool.hasSession(req)) return res.status(403).json({result:"err",status:403,err:"forbidden"})
      fs.readdir('./images/' + req.session.server_id + '/', function(err, files){
      if (err) return res.status(500).json({result:"err",status:500,err:"internal error"})
     return res.json({result:"ok",status:200,images: files});
    });
  })

  return router
}
