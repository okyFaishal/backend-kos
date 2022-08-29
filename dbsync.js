const command = process.argv[process.argv.indexOf(__filename.replace(/\..*/, ''))+1] //command
const koneksi = require('./config/connection');

let normalizedPath = require("path").join(__dirname, "./module");

require("fs").readdirSync(normalizedPath).forEach(function(file) {
  let normalize = require("path").join(__dirname, "./module/"+file)
  require("fs").readdirSync(normalize).forEach(function(file2) {
    if(file2=="model.js"){
        require(`./module/${file}/model.js`)
    }
  })
})

async function start() {
  if(command == 'refresh' || !command){
    await koneksi.sync({ force: true })
    await admin()
    console.log('Database Berhasil di Sinkronisasi')
  }else if(command == 'reset'){
    await koneksi.drop()
    await koneksi.sync({ force: true })
    await admin()
    console.log('Database Berhasil di Reset')
  }else if(command == 'seed'){
    await koneksi.drop()
    await koneksi.sync({ force: true })
    await admin()
    const seed = require('./seed')
    await seed.start()
    console.log('Database Berhasil di Reset')
  }else if(command == 'delete'){
    await koneksi.drop()
    console.log('Tabel Berhasil di Delete')
  }else{
    console.log('Input Tidak Valid')
  }
}

//create admin
async function admin(){
  try {
    let user = require('./module/user/model')
    let dataUser = await user.findAll({where: {status_user: true}})
    // console.log(dataUser)
    if(dataUser.length == 0) dataUser = await user.create({
      public: true,
      public_religion: false,
      public_gender: false,
      image_profile: 'default.jpg',
      image_ktp: 'default.jpg',
      status_user: true,
      username: 'admin',
      email: 'admin@gmail.com',
      verify_email: false,
      contact: 123456123456,
      password: '$2a$10$5z/eRjrluqOEatQ7ul7b9.y7VkrfYPx6sEAFvtThH7SQ6y8cmU6Zm',
      nik: 1234567812345678,
      birth_place: 'admin',
      birth_date: new Date(),
      religion: 'admin',
      gender: 'admin',
      status: 'admin',
    })
  // console.log(dataUser)
  } catch (error) {
    console.log("error")
    console.log(error)
  }
}

start()
// koneksi.sync({ alter: true }).then(() => {
//   console.log('Database Berhasil di Sinkronisasi')
//   console.log('disconnecting...')
// }).catch(e => {
//   console.log(e)
// });