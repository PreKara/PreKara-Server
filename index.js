'use strict'

const
  express = require('express'),
  session = require('express-session'),
  bodyParser = require('body-parser'),
  mongojs = require('mongojs'),
  multer = require('multer'),
  uniqid = require('uniqid'),
  path = require('path'),
  mime = require("mime"),
  app = express(),
  http = require('http').Server(app),
  tool = require("./tool"),
  io = require('socket.io')(http),
  MongoStore = require('connect-mongo')(session)

const base = "/api/v1"
const mongopath = process.env.MONGO_URL || "localhost";

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

const db = mongojs(mongopath + '/prekara', ['server'])

var sessionMiddleware = session({
  store: new MongoStore({
    db: 'session',
    host: mongopath,
    port: '27017',
    url: 'mongodb://' + mongopath + ':27017/prekara'
  }),
  secret: "ojimizucoffee",
  resave: false,
  saveUninitialized: false
});

io.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

app.use(sessionMiddleware);

app.disable('x-powered-by')
// app.use(session({secret: 'ojimizucoffee', resave: false, saveUninitialized: false}))
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
  if(client.request.session.server_id) {
    client.join(client.request.session.server_name)
    tool.imageShuffle(client.request,db)
  }else{
    io.to(client.id).emit('error','session')
  }
})



const s = http.listen(process.env.PORT || 3000,function(){})

const server = require('./routes/server')(db),
  rsession = require('./routes/session')(db),
  theme = require('./routes/theme')(db),
  presenter = require('./routes/presenter')(db),
  image = require('./routes/image')(uploader,db),
  control = require('./routes/control')(db,io)

app.use(base + "/server",server)
app.use(base + "/session",rsession)
app.use(base + "/theme",theme)
app.use(base + "/presenter",presenter)
app.use(base + "/image",image)
app.use(base + "/control",control)

app.get("/api/",(req,res) => res.json({result:"ok",status:200,version:"v1"}))
