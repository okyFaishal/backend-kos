const moment = require('moment')
const db = {
  main: require('./config/connection'),
  user: require('./module/user/model'),
  build: require('./module/build/model'),
  history: require('./module/history/model'),
  package: require('./module/package/model'),
  payment: require('./module/payment/model'),
  room: require('./module/room/model')
}

async function start(){
  try {
    //user
    let dataUser = []
    for (let i = 0; i < 5; i++) {
      let uniq = new Date().valueOf()+''
      let {nik , contact, username, email, status, name_company, name_university, major, degree, generation} = acak(
        {nik: (uniq + '' + i).padStart(16, '0'), contact: (uniq + i).slice(-12), username: `mona${i}`, email: `mona${(uniq + i).slice(-6)}@gmail.com`, status: 'pekerja', name_company: 'voc'}, 
        {nik: (uniq + '' + i).padStart(16, '0'), contact: (uniq + i).slice(-12), username: `yuzu${i}`, email: `yuzu${(uniq + i).slice(-6)}@gmail.com`, status: 'mahasiswa', name_company: null, name_university: 'havard', major: 'farmasi', degree: 's1', generation: 1998}, 
        {nik: (uniq + '' + i).padStart(16, '0'), contact: (uniq + i).slice(-12), username: `lotte${i}`, email: `lotte${(uniq + i).slice(-6)}@gmail.com`, status: 'pekerja', name_company: 'voc'}, 
        {nik: (uniq + '' + i).padStart(16, '0'), contact: (uniq + i).slice(-12), username: `nyan${i}`, email: `nyan${(uniq + i).slice(-6)}@gmail.com`, status: 'mahasiswa', name_company: null, name_university: 'stanford', major: 'psikologi', degree: 's1', generation: 1999}, 
        {nik: (uniq + '' + i).padStart(16, '0'), contact: (uniq + i).slice(-12), username: `joko${i}`, email: `joko${(uniq + i).slice(-6)}@gmail.com`, status: 'mahasiswa', name_company: null, name_university: 'oxford', major: 'teknik informatika', degree: 's1', generation: 2000}, 
      )
      dataUser.push({
        public: acak(true, false),
        public_religion: acak(true, false),
        public_gender: acak(true, false),
        image_profile: 'default.jpg',
        image_ktp: 'default.jpg',
        status_user: false,
        username,
        email,
        verify_email: acak(true, false),
        contact,
        password: '$2a$10$5z/eRjrluqOEatQ7ul7b9.y7VkrfYPx6sEAFvtThH7SQ6y8cmU6Zm',
        nik,
        birth_place: acak('semarang', 'bandung', 'surabaya', 'jakarta', 'yogyakarta', 'merauke', 'beijing'),
        birth_date: new Date(),
        religion: acak('islam', 'kristen', 'katolik', 'budha', 'konghuchu', 'hindu'),
        gender: acak('laki - laki', 'perempuan'),
        status,
        name_company,
        name_university,
        major,
        degree,
      })
      
    }
    let resultUser = await db.user.bulkCreate(dataUser)

    //build
    let dataBuild = [
      {name: 'kos jaya', address: 'jalan kos jaya 1'},
      {name: 'kos makmur', address: 'jalan kos makmur 1'},
    ]
    let resultBuild = await db.build.bulkCreate(dataBuild)

    //room
    let dataRoom = []
    resultBuild.forEach(el => {
      for (let i = 0; i < 5; i++) {
        dataRoom.push({
          build_id: el.id,
          name: i,
          size: acak('10 x 10', '15 x 15'),
          price: acak(1000000, 1500000)
        })
      }
    })
    let resultRoom = await db.room.bulkCreate(dataRoom)

    //package
    let dataPackage = [
      {name: '6 bulan',description: 'kos selama setengah tahun', duration: 6, discount: 0},
      {name: '1 tahun',description: 'kos selama setahun penuh, mendapatkan diskon 1 bulan gratis', duration: 12, discount: 1},
    ]
    let resultPackage = await db.package.bulkCreate(dataPackage)

    //history
    let dataHistory = []
    resultUser.forEach((elUser, inUser, arUser) => {
      resultRoom.forEach((elRoom, inRoom, arRoom) => {
        for (let i = 0; acak(0, 1, 2, 3, 4); i++) {
          let start_kos = moment()
          let pack = resultPackage[acak(0, 1)]
          let price = Number.parseInt(elRoom.price)
          let discount = Number.parseInt(pack.discount)
          let duration = Number.parseInt(pack.duration)
          let pay = price * (duration - discount) - (price * acak(0 ,0 , 1, 2, 3, 0, 0, 0))
          let historyNew = {user_id: elUser.id, room_id: elRoom.id, package_id: pack.id, start_kos, pay}
          for (let i = dataHistory.length - 1; i >= 0; i--) {
            const elHistory = dataHistory[i];
            if(elHistory.room_id == elRoom.id || elHistory.user_id == elUser.id){
              historyNew.start_kos = moment(elHistory.start_kos).subtract(pack.duration, 'month')
              break;
            }
          }
          dataHistory.push(historyNew)
        }
      })
    })
    let resultHistory = await db.history.bulkCreate(dataHistory)

    //payment
    let dataPayment = []
    resultHistory.forEach(elHistory => {
      dataPayment.push({user_id: elHistory.userId, history_id: elHistory.id, pay: elHistory.pay * 25 / 100, type: 'dp', date: moment()})
      for (let i = 0; i < acak(1, 2, 3); i++) {
        let totalPay = 0
        dataPayment.forEach(elPayment => {
          if(elPayment.history_id == elHistory.id){
            totalPay += elPayment.pay
          }
        })
        let pay = acak(1, 2, 3, 4, 5) * (elHistory.pay * 10 / 100)
        if((totalPay + pay > elHistory.pay)) continue
        dataPayment.push({user_id: elHistory.userId, history_id: elHistory.id, pay, type: 'angsuran', date: moment()})
      }
    });
    let resultPayment = await db.payment.bulkCreate(dataPayment)
    // console.log(dataPayment.slice(0, 5))
  } catch (error) {
    console.log("error")
    console.log(error)
  }
}start()


function acak(){
  let data = arguments
  if(arguments[0] == 'array') data.splice(0, 1)
  let kembalian
  do {
    let mona
    if((mona = Math.floor(Math.random() * 11)) < data.length) kembalian = mona
  } while (kembalian == undefined);
  return data[kembalian]
}

module.exports = {start}