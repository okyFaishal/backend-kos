// const { Connection, Statement, } = require('idb-pconnector');
const Excel = require('exceljs');

async function generateExcel() {
  // Create connection with DB2
  // const connection = new Connection({ url: '*LOCAL' });
  // const statement = new Statement(connection);
  // const sql = 'SELECT CUSNUM, LSTNAM, BALDUE, CDTLMT FROM QIWS.QCUSTCDT'

  // Execute the statement to fetch data in results
  // const results = await statement.exec(sql);
  const results = [
    {id: 1, name: 'joko 1', price: 1000},
    {id: 2, name: 'joko 2', price: 2000},
    {id: 3, name: 'joko 3', price: 3000},
    {id: 4, name: 'joko 4', price: 4000},
    {id: 5, name: 'joko 5', price: 5000},
    {id: 6, name: 'joko 6', price: 6000},
    {id: 7, name: 'joko 7', price: 7000},
  ];

  // Create Excel workbook and worksheet
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet('Payment');
  
  // Define columns in the worksheet, these columns are identified using a key.
  worksheet.columns = [
    { header: 'Id', key: 'id', width: 5 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'status', key: 'status', width: 10 },
    { header: 'Price', key: 'price', width: 15 },
    // { header: 'Balance Due', key: 'BALDUE', width: 11 },
    // { header: 'Credit Limit', key: 'CDTLMT', width: 10 }
  ]
  
  for (const row of results) {
    worksheet.addRow(row);
  }
  worksheet.autoFilter = 'A1:E1';

  // Process each row for beautification 
  worksheet.eachRow(function (row, rowNumber) {
    row.eachCell((cell, colNumber) => {
      // console.log(cell.value)
      if (rowNumber == 1) {
        // First set the background of header row
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'f5b914' }
        }
      }
      // Set border of each cell 
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    })
    //Commit the changed row to the stream
    row.commit();
  });
  let price = worksheet.getColumn('price')
  // console.log(price)
  price.eachCell((cell, i)=>{
    if(cell.value > 2000){
      cell.value = 'lunas'
      // worksheet.getColumn('status').fill[i] = {
      //   type: 'pattern',
      //   pattern: 'solid',
      //   fgColor: { argb: '1af20f' }
      // };
    }else{
      cell.value = 'belum lunas'
      // worksheet.getColumn('status').fill[i] = {
      //   type: 'pattern',
      //   pattern: 'solid',
      //   fgColor: { argb: 'f20f1a' }
      // };

    }
  })
  // Finally save the worksheet into the folder from where we are running the code. 
  await workbook.xlsx.writeFile('SimpleCust.xlsx');
}

generateExcel().catch((error) => {
    console.error(error);
});

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