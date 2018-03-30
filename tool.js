module.exports = {
  hasSession: (req) => {
    return req.session.hasOwnProperty("server_id")
  },
  isExist: (file) => {
    try {
      fs.statSync(file);
      return true
    } catch(err) {
      if(err.code === 'ENOENT') return false
    }
  }
}
