const koneksi = require('./config/connection');

let normalizedPath = require("path").join(__dirname, "./module");

require("fs").readdirSync(normalizedPath).forEach(function(file) {
  let normalize = require("path").join(__dirname, "./module/"+file);
  require("fs").readdirSync(normalize).forEach(function(file2) {
    if(file2=="model.js"){
        require(`./module/${file}/model.js`)
    }
  });
});

koneksi.sync({ alter: true }).then(() => {
  console.log('Database Berhasil di Sinkronisasi')
  console.log('disconnecting...')
}).catch(e => {
  console.log(e)
});