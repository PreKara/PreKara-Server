const mongojs = require('mongojs'),fs = require('fs-extra')

const mdb = mongojs('prekara', ['server','theme'])
mdb.server.remove({})
mdb.theme.remove({})
mdb.close()

fs.removeSync('./images')
fs.mkdirsSync('./images')
