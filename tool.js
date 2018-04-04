module.exports = {
  hasSession: (req) => {
    return req.session.hasOwnProperty("server_id")
  },
  imageShuffle: (req,db) => {
    const f = require("fs-extra").readdirSync('./images/' + req.session.server_id + '/') || []
    if(f.length == 0) return
    db.server.findOne({_id: require("mongojs").ObjectID(req.session.server_id)},(err,result) => {
      if(!result.hasOwnProperty("files") || result.files.length == 0)
        var s = ""
      else
        var s = result.files[0]
      do{
        shuffle(f)
//        for(var i = f.length - 1; i > 0; i--){
//          var r = Math.floor(Math.random() * (i + 1));
//          var tmp = f[i];
//          f[i] = f[r];
//          f[r] = tmp;
//        }
        console.log(f[f.length - 1] + " == " + s)
      } while(f[f.length - 1] == s)
      db.server.update({"_id": require("mongojs").ObjectID(req.session.server_id)},{$set: {"files": f,"countf":f.length}},{multi: false},(err,res) => {
        if (err) console.log(err)
      })
    })
  },
  themeShuffle: (req,db) => {
    db.server.findOne({_id: require("mongojs").ObjectID(req.session.server_id)},(err,result) => {
      var f = result.theme || []
      var s = result.theme[0] || ""
      do{
        for(var i = f.length - 1; i > 0; i--){
          var r = Math.floor(Math.random() * (i + 1));
          var tmp = f[i];
          f[i] = f[r];
          f[r] = tmp;
        }
      } while(f[f.length - 1] == s)
      db.server.update({"_id": require("mongojs").ObjectID(req.session.server_id)},{$set: {"theme": f}},{multi: false},(err,res) => {
        if (err) console.log(err)
      })
    })
  }
}
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}
