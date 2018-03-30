module.exports = {
  hasSession: (req) => {
    return req.session.hasOwnProperty("server_id")
  }
}
