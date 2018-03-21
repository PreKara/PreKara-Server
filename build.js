const git = require('simple-git'), fs = require("fs-extra")

if(isExist('./public/')) fs.removeSync('./public/');

fs.mkdirsSync('./public/');
git().clone('https://github.com/PreKara/PreKara-Web', './public/',(err,res) => {
  fs.removeSync('./public/README.md');
  fs.removeSync('./public/LICENSE');
  fs.removeSync('./public/.git');
});

function isExist(file) {
  try {
    fs.statSync(file);
    return true
  } catch(err) {
    if(err.code === 'ENOENT') return false
  }
}
