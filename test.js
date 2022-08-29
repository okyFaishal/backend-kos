// let array = [1, 2, 3, ,4, 5, ,6]
// array.forEach(element => {
//   if(element == 3) 
//   // break;

// });


// console.log(typeof (new Date().valueOf()+''))
// console.log({
//   name: 'mona',
//   email: this.name
// })

// const mom

// require('dotenv').config()
// console.log(process.env)


// let cek = 1
// console.log(Number.isInteger(100))
// console.log(Number.isInteger('100'))
// console.log(Number.isInteger(parseInt(100)))
// console.log(Number.isInteger(parseInt('100')))
// console.log(Number.isInteger(parseInt('as100')))
// console.log(typeof 100)
// console.log(typeof '100')

// let mona = {halo: "hai dunia", angka: 123}
// console.log(mona)
// console.log(typeof mona)
// console.log(mona.test)

// const moment = require('moment')
// console.log(moment())
// console.log(moment() > moment())
// console.log(moment() > new Date())
// console.log(new Date())
// console.log(typeof new Date())
// console.log(moment('2020-02-29').add(12, 'months'))
// console.log(moment('2020-08-30').add(6, 'months'))
// console.log(moment('2021-02-28').add(6, 'months'))
// console.log(moment('2021-02-28').add(6, 'months') > moment('2021-02-28'))
// console.log(moment('2021-02-28').add(6, 'months') < moment('2021-02-28'))
// console.log(new Date('2021-02-32'))
// console.log(new Date('2021-02-32') == 'invalid date')
// console.log(new Date('2021-02-32') == 'Invalid Date')
// console.log(new Date('2020-02-09'))
// console.log(new Date('2020-02-09') == 'invalid date')
// console.log(new Date('2020-02-09') == 'Invalid Date')

// const db = {
//   user: require('./module/user/model'),
//   otp: require('./module/otp/model'),
//   chat: require('./module/chat/model'),
//   db: require('./config/connection'),
// }

// async function test(){
//   try {
//     // console.log(await db.user.findAll())
//     // console.log(await db.otp.create({
//     //   email: 'test'+Math.random()+'@gmail.com', 
//     //   type: 'register', 
//     //   valid_until: new Date(), 
//     //   otp: '908767', 
//     // }))
//     // // console.log(await db.db.query(`insert into otp(email, type, valid_until, otp) values('test${Math.random()}@gmail.com', 'register', now(), 90987)`))
//     // console.log(await db.otp.findAll())
//     // console.log(await db.db.query('select * from otp'))

//     let data
//     console.log(data = await db.user.create({
//       image_profile: 'asd.jpg',
//       image_ktp: '123.jpg',
//       username: 'mona',
//       email: 'mona'+Math.random()+'@gmail.com',
//       password: 'ubomd0w92nvoefjvn',
//       contact: '123.019283746565',
//       nik: Math.random(),
//       birth_place: 'semarang',
//       birth_date: new Date(),
//       religion: 'islam',
//       gender: 'laki laki',
//       status: 'mahasiswa',
//     }))
//     console.log("========================")
//     console.log(data = await db.chat.create({
//       date: new Date(),
//       message: 'asdqwe123',
//       userId: data.id
//     }))
//     console.log("========================")
//     console.log(await db.chat.findAll())
//     console.log("========================")
//     console.log(await db.db.query('select * from chat'))
//   } catch (error) {
//     console.log("error")
//     console.log(error)
//   }
// }
// test()