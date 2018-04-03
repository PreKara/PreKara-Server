'use strict'

const
  express = require('express'),
  express_session = require('express-session'),
  bodyParser = require('body-parser'),
  mongojs = require('mongojs'),
  multer = require('multer'),
  uniqid = require('uniqid'),
  path = require('path'),
  mime = require("mime"),
  app = express(),
  http = require('http').Server(app),
  io = require('socket.io')(http)

const base = "/api/v1"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './images/' + req.session.server_id + '/')
  },
  filename: function (req, file, cb) {
    req.uniqid = uniqid() + path.extname(file.originalname)
    cb(null, req.uniqid)
  }
})

const uploader = multer({ storage: storage, fileFilter: function (req, file, cb) {
  const ext = path.extname(file.originalname)
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png' && ext !== '.gif' && ext !== '.bmp') return cb(null,false,'not image')
  cb(null, true)
}}).single("image");

exports.finish = () => {
  s.close()
  db.close()
}

const db = mongojs('prekara', ['server'])

app.disable('x-powered-by')
app.use(express_session({secret: 'ojimizucoffee', resave: false, saveUninitialized: false}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'))
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://prekara.mizucoffee.net/");
//  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

io.on('connection',(client) => {
  console.log('connected')
  client.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
})



const s = http.listen(process.env.PORT || 3000,function(){})

const server = require('./routes/server')(db),
  session = require('./routes/session')(db),
  theme = require('./routes/theme')(db),
  presenter = require('./routes/presenter')(db),
  image = require('./routes/image')(uploader),
  presentation = require('./routes/control/presentation')(db),
  slide = require('./routes/control/slide')(db)

app.use(base + "/server",server)
app.use(base + "/session",session)
app.use(base + "/theme",theme)
app.use(base + "/presenter",presenter)
app.use(base + "/image",image)
app.use(base + "/control/presentation",presentation)
app.use(base + "/control/slide",slide)

app.get("/api/",(req,res) => res.json({result:"ok",status:200,version:"v1"}))
