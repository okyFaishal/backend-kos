const sq = require('../../config/connection');
const writeExcel = require('../../helper/write-exel')
// const {sequelize} = require('../../config/connection');
const dbpayment = require('./model');
const history = require('../history/model');
const package = require('../package/model');
const room = require('../room/model');
const { QueryTypes } = require('sequelize');
// const sequelize = require('sequelize');
const moment = require('moment')
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const Excel = require('exceljs');

class Controller {
  static async exportXlsx(req, res, next) {
    try {
      let {user_id, history_id, build_id, package_id, room_id, pay, date, type, mode} = req.query
      const workbook = new Excel.Workbook();
      let result = []
      let worksheet
      switch (mode) {
        case 'all':
        case 'history': //===== history =====
          result = await sq.query(`
            select 
              h.id as history_id, u.id as user_id, r.id as room_id, b.id as build_id, p.id as package_id, u.image_profile,
              u.username , u.email , u.status ,
              b."name" as build, b.address ,
              r."name" as room, r."size" , 
              p.description , p.duration , p."name" as "package",
              h.type_discount, h.discount, 
              r.price as "price_room", h.pay as "total_price", sum(p2.pay)::integer as "total_payment", (h.pay - sum(p2.pay))::integer as "deficiency",
              h.start_kos , h.start_kos + interval '1 month' * p.duration - interval '1 day' as "end_kos"
            from history h
              inner join "user" u on u.id = h.user_id 
              inner join room r on r.id = h.room_id 
              inner join build b on b.id = r.build_id 
              inner join package p on p.id = h.package_id 
              left join payment p2 on p2.deleted_at is null and p2.history_id = h.id 
            where h.deleted_at is null 
            ${user_id?'and u.id=:user_id':''} 
            ${room_id?'and r.id=:room_id':''} 
            ${package_id?'and p.id=:package_id':''}
            ${history_id?'and h.id = :history_id':''}
            ${build_id?'and b.build_id = :build_id':''}
            group by h.id, u.id, r.id, b.id, p.id
            order by h.updated_at desc
          `,{
            replacements: {user_id, package_id, room_id},
            type: QueryTypes.SELECT
          })
          // throw {status: 400, message: result}
          if(result.length == 0) throw {status: 402, message: 'data tidak ditemukan'}
          worksheet = workbook.addWorksheet('History');
          worksheet.columns = [
            {header: 'Username', key: 'username', width: 15},
            {header: 'Build', key: 'build', width: 15},
            {header: 'Room', key: 'room', width: 10},
            {header: 'Package', key: 'package', width: 17},
            {header: 'Duration', key: 'duration', width: 15},
            {header: 'Type Discount', key: 'type_discount', width: 15},
            {header: 'Discount', key: 'discount', width: 15},
            {header: 'Total Discount', key: 'total_discount', width: 15},
            {header: 'Price Room', key: 'price_room', width: 19},
            {header: 'Total Price', key: 'total_price', width: 19},
            {header: 'Total Payment', key: 'total_payment', width: 19},
            {header: 'Deficiency', key: 'deficiency', width: 19},
            {header: 'Start Kos', key: 'start_kos', width: 19},
            {header: 'End Kos', key: 'end_kos', width: 19 }
          ]
          for (let i = 0; i < result.length; i++) {
            let row = result[i]
            result[i].total_discount = 0
            //menghitung total discount
            switch (result[i].type_discount) {
              case '%':
                result[i].total_discount = result[i].total_discount * (result[i].discount / 100)
                break;
              case 'month':
                result[i].total_discount = result[i].price_room * result[i].discount
                break;
              case 'nominal':
                result[i].total_discount = result[i].discount
                break;
            }
            //jika terdapat orang yang keluar saat ngekos
            if(result[i].total_price == -1) {
              result[i].total_price = (row.price_room * row.duration) - row.total_discount
              result[i].deficiency = result[i].total_price - row.total_payment
              result[i].keluar = true
            }else{
              result[i].keluar = false
            }
            let resRow = worksheet.addRow(result[i]);
            if(result[i].keluar){
              resRow.fill = {
                type: 'pattern',
                pattern:'solid',
                fgColor: { argb: 'ffea11' }
            };
            }
          }
          const endRowHistory = worksheet.lastRow.number + 1;
          worksheet.autoFilter = 'A1:N1';
          let firstRowHistory = worksheet.getRow(1)
          firstRowHistory.height = 20
          firstRowHistory.eachCell((cell, i)=>{
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'f5b914' }
            }
          })
          firstRowHistory.commit()
          worksheet.getColumn('total_discount').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('price_room').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('total_price').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('total_payment').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('deficiency').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('start_kos').numFmt = `[$-en-ID]dd mmmm yyyy`
          worksheet.getColumn('end_kos').numFmt = `[$-en-ID]dd mmmm yyyy`
          worksheet.addRow({
            total_discount: { formula: `SUM(H2:H${endRowHistory - 1})` },
            total_price: { formula: `SUM(J2:J${endRowHistory - 1})` },
            total_payment: { formula: `SUM(K2:K${endRowHistory - 1})` },
          });
        case 'all':
          if(mode == 'history') break
        case 'user': //===== user =====
          //========== history ==========
          let data = []
          for (let i = 0; i < result.length; i++) {
            const item = result[i];
            let indexData = data.length
            let dataSementara = {
              total_price_user: item.total_price,
              total_payment_user: item.total_payment,
              total_discount_user: item.total_discount
            }
            for (let o = 0; o < data.length; o++) {
              const itemData = data[o];
              // console.log(itemData.user_id, item.user_id)
              // console.log(itemData.user_id, item.user_id, o)
              if(itemData.user_id == item.user_id) {
                indexData = o
                // console.log("11", dataSementara)
                dataSementara = {
                  total_price_user: dataSementara.total_price_user + itemData.total_price_user, 
                  total_payment_user: dataSementara.total_payment_user + itemData.total_payment_user, 
                  total_discount_user: dataSementara.total_discount_user + itemData.total_discount_user
                }
                // console.log("22", dataSementara)
                break;
              }
            }
            // console.log(item, dataSementara)
            if(!(moment() < moment(item.end_kos) && moment() > moment(item.start_kos))){ //user yang tidak memesan saat ini
              // console.log('cek1', item.start_kos, data[indexData], item)
              if((data[indexData])){ //data user sudah dibuat
                dataSementara.build = data[indexData].build
                dataSementara.package = data[indexData].package
                dataSementara.duration = data[indexData].duration
                dataSementara.room = data[indexData].room
                dataSementara.type_discount = data[indexData].type_discount
                dataSementara.discount = data[indexData].discount
                dataSementara.price_room = data[indexData].price_room
                dataSementara.total_price = data[indexData].total_price
                dataSementara.total_payment = data[indexData].total_payment
                dataSementara.deficiency = data[indexData].deficiency
                dataSementara.start_kos = data[indexData].start_kos
                dataSementara.end_kos = data[indexData].end_kos
              }else{ //data user belum dibuat
                dataSementara.build = null
                dataSementara.package = null
                dataSementara.duration = null
                dataSementara.room = null
                dataSementara.type_discount = null
                dataSementara.discount = null
                dataSementara.price_room = null
                dataSementara.total_price = null
                dataSementara.total_payment = null
                dataSementara.deficiency = null
                dataSementara.start_kos = null
                dataSementara.end_kos = null
              }
            }
            data[indexData] = {...item, ...dataSementara}
          }
          // console.log(data)
          if(data.length == 0) throw {status: 402, message: 'data tidak ditemukan'}
          worksheet = workbook.addWorksheet('User');
          worksheet.columns = [
            {header: 'Username', key: 'username', width: 15},
            {header: 'Total Price', key: 'total_price_user', width: 18},
            {header: 'Total Payment', key: 'total_payment_user', width: 18},
            {header: 'Total Discount', key: 'total_discount_user', width: 18},
            {header: 'Build', key: 'build', width: 15},
            {header: 'Package', key: 'package', width: 12},
            {header: 'Duration', key: 'duration', width: 12},
            {header: 'Room', key: 'room', width: 10},
            {header: 'Type Discount', key: 'type_discount', width: 16},
            {header: 'Discount', key: 'discount', width: 10},
            {header: 'Price Room', key: 'price_room', width: 17},
            {header: 'Total Price', key: 'total_price', width: 17},
            {header: 'Total Payment', key: 'total_payment', width: 17},
            {header: 'Deficiency', key: 'deficiency', width: 17},
            {header: 'Start Kos', key: 'start_kos', width: 19},
            {header: 'End Kos', key: 'end_kos', width: 19 }
          ]
          for (const row of data) {
            worksheet.addRow(row);
          }
          const endRowUser = worksheet.lastRow.number + 1;
          worksheet.autoFilter = 'A1:S1';
          let firstRowUser = worksheet.getRow(1)
          firstRowUser.height = 20
          firstRowUser.eachCell((cell, i)=>{
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'f5b914' }
            }
            cell.num
          })
          firstRowUser.commit()
          worksheet.getColumn('total_price_user').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('total_payment_user').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('total_discount_user').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('price_room').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('total_price').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('total_payment').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('deficiency').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('start_kos').numFmt = `[$-en-ID]dd mmmm yyyy`
          worksheet.getColumn('end_kos').numFmt = `[$-en-ID]dd mmmm yyyy`
          worksheet.addRow({
            total_price_user: { formula: `SUM(B2:B${endRowUser - 1})` },
            total_payment_user: { formula: `SUM(C2:C${endRowUser - 1})` },
            total_discount_user: { formula: `SUM(D2:D${endRowUser - 1})` },
          });          
          // break;
        case 'all':
          if(mode == 'user') break
        default: //===== payment =====        
          result = await sq.query(`
            select 
              u.id as user_id, p.id as payment_id, h.id as history_id, p2.id as package_id, r.id as room_id, b.id as build_id, u.image_profile,
              b."name" as "build", b.address,
              p2."name" as "package", p2.duration ,
              r."name" as "room", r."size", 
              u.username , u.email , u.status ,
              h.type_discount, h.discount,
              r.price as "price_room", h.pay as "total_price", p.pay as "payment", (sum(p3.pay))::integer as "total_payment", (h.pay - sum(p3.pay)::integer) as "deficiency", 
              p."type" as "type_payment", p."date" ,
              h.start_kos ,h.start_kos + interval '1 month' * p2.duration - interval '1 day' as "end_kos"
            from payment p 
              inner join "user" u on u.id = p.user_id
              inner join history h on h.id = p.history_id and h.deleted_at is null
              inner join package p2 on p2.id = h.package_id 
              inner join room r on r.id = h.room_id
              inner join build b on b.id = r.build_id 
              left join payment p3 on p3.history_id = h.id and p3."date" <= p."date" and p3.deleted_at is null
            where p.deleted_at is null 
            ${user_id?'and u.id = :user_id':''}  
            ${room_id?'and r.id=:room_id':''} 
            ${package_id?'and p.id=:package_id':''}
            ${history_id?'and p.history_id = :history_id':''}
            ${build_id?'and b.build_id = :build_id':''}
            ${type?'and p.type = :type':''}
            group by p.id, u.id, h.id, p2.id, r.id, b.id
            order by p.date desc
          `, {type: QueryTypes.SELECT, replacements: {user_id, history_id, pay, date, type}})
          if(result.length == 0) throw {status: 402, message: 'data tidak ditemukan'}

          //export excel
          worksheet = workbook.addWorksheet('Payment')
          worksheet.columns = [
            {header: 'Username', key: 'username', width: 15},
            {header: 'Build', key: 'build', width: 15},
            {header: 'Package', key: 'package', width: 12},
            {header: 'Duration', key: 'duration', width: 13},
            {header: 'Room', key: 'room', width: 10},
            {header: 'Status', key: 'status', width: 10},
            {header: 'Start Kos', key: 'start_kos', width: 19},
            {header: 'End Kos', key: 'end_kos', width: 19 },
            {header: 'Type Discount', key: 'type_discount', width: 15},
            {header: 'Discount', key: 'discount', width: 10},
            {header: 'Total Discount', key: 'total_discount', width: 17},
            {header: 'Price Room', key: 'price_room', width: 17},
            {header: 'Total Price', key: 'total_price', width: 17},
            {header: 'Payment', key: 'payment', width: 17},
            {header: 'Total Payment', key: 'total_payment', width: 17},
            {header: 'Deficiency', key: 'deficiency', width: 17},
            {header: 'Type Payment', key: 'type_payment', width: 16},
            {header: 'Date', key: 'date', width: 19},
          ]
          // for (const row of result) {
          //   worksheet.addRow(row);
          // }
          for (let i = 0; i < result.length; i++) {
            let row = result[i]
            //menghitung total discount
            result[i].total_discount = 0
            switch (result[i].type_discount) {
              case '%':
                result[i].total_discount = result[i].total_discount * (result[i].discount / 100)
                break;
              case 'month':
                result[i].total_discount = result[i].price_room * result[i].discount
                break;
              case 'nominal':
                result[i].total_discount = result[i].discount
                break;
            }
            //jika terdapat orang yang keluar saat ngekos
            if(result[i].total_price == -1) {
              result[i].total_price = (row.price_room * row.duration) - row.total_discount
              result[i].deficiency = result[i].total_price - row.total_payment
              result[i].keluar = true
            }else{
              result[i].keluar = false
            }
            let resRow = worksheet.addRow(result[i]);
            if(result[i].keluar){
              resRow.fill = {
                type: 'pattern',
                pattern:'solid',
                fgColor: { argb: 'ffea11' }
            };
            }
          }
          const endRow = worksheet.lastRow.number + 1;
          worksheet.autoFilter = 'A1:S1';
          let firstRow = worksheet.getRow(1)
          firstRow.height = 20
          firstRow.eachCell((cell, i)=>{
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'f5b914' }
            }
            cell.num
          })
          firstRow.commit()
          worksheet.getColumn('price_room').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('total_price').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('payment').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('total_payment').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('total_discount').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('deficiency').numFmt = '_-Rp* #,##0_-;-Rp* #,##0_-;_-Rp* "-"_-;_-@_-'
          worksheet.getColumn('date').numFmt = `[$-en-ID]dd mmmm yyyy`
          worksheet.getColumn('start_kos').numFmt = `[$-en-ID]dd mmmm yyyy`
          worksheet.getColumn('end_kos').numFmt = `[$-en-ID]dd mmmm yyyy`
          worksheet.addRow({
            payment: { formula: `SUM(N2:N${endRow - 1})` },
          });
          break;
      }      

      const downloadFolder = path.resolve(__dirname, "../../asset/downloads");
      if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder);
      }
      await workbook.xlsx.writeFile(`${downloadFolder}${path.sep}payment.xls`);
      res.download(`${downloadFolder}${path.sep}payment.xls`);
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async showPayment(req, res, next) {
    try {
      let {payment_id, user_id, history_id, build_id, type, page, limit} = req.query
      // req.dataUsers.status_user?true:user_id = req.dataUsers.id
      let result = await sq.query(`
        select 
          count(*) over() as "count", u.id as user_id, p.id as payment_id, h.id as history_id, p2.id as package_id, r.id as room_id, b.id as build_id, u.image_profile, 
          b."name" as "build", b.address,
          p2."name" as "package", p2.duration ,
          r."name" as "room", r."size", 
          u.username , u.email , u.status ,
          h.type_discount, h.discount, 
          r.price as "price_room", h.pay as "total_price", p.pay as "payment", (sum(p3.pay))::integer as "total_payment", (h.pay - sum(p3.pay)::integer) as "deficiency", 
          p."type" as "type_payment", p."date" ,
          h.start_kos ,h.start_kos + interval '1 month' * p2.duration - interval '1 day' as "end_kos"
        from payment p 
          inner join "user" u on u.id = p.user_id
          inner join history h on h.id = p.history_id and h.deleted_at is null 
          inner join package p2 on p2.id = h.package_id  
          inner join room r on r.id = h.room_id  
          inner join build b on b.id = r.build_id  
          left join payment p3 on p3.history_id = h.id and p3."date" <= p."date" 
        where p.deleted_at is null 
        ${payment_id?'and p.id = :payment_id':''}  
        ${user_id?'and u.id = :user_id':''}  
        ${history_id?'and p.history_id = :history_id':''}
        ${build_id?'and b.build_id = :build_id':''}
        ${type?'and p.type = :type':''}
        group by p.id, u.id, h.id, p2.id, r.id, b.id
        order by p.date desc
        offset ${page?':page':0} rows
        ${limit?`fetch first :limit rows only`:''}
      `, {type: QueryTypes.SELECT, replacements: {payment_id, user_id, history_id, type, page, limit}})
      if(result.length == 0) throw {status: 402, message: 'data tidak ditemukan'}
      let count = 0
      for (let i = 0; i < result.length; i++) {
        //jika keluar
        if(result[i].total_price == -1) {
          result[i].total_price = result[i].price_room * result[i].duration
          result[i].total_discount = 0
          //menghitung total discount
          switch (result[i].type_discount) {
            case '%':
              result[i].total_discount = result[i].total_price * (result[i].discount / 100)
              break;
            case 'month':
              result[i].total_discount = result[i].price_room * result[i].discount
              break;
            case 'nominal':
              result[i].total_discount = result[i].discount
              break;
          }
          result[i].total_price -= result[i].total_discount
          result[i].deficiency = result[i].total_price - result[i].total_payment
          result[i].keluar = true
        }else{
          result[i].keluar = false
        }
        if(count == 0) count = result[i].count
        result[i].count = undefined
      }
      res.status(200).json({status: 200, message: 'success show payment', data: {data_payment: result, limit, pageNow: page, pageLast: limit ? Math.ceil(count/limit) : undefined, count}})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async showIncome(req, res, next) {
    try {
      let result = await sq.query(`select sum(pay), to_char("date" , 'YYYY-MM') as bulan from payment where deleted_at is null group by bulan order by bulan desc`, {type: QueryTypes.SELECT})
      if(result.length == 0) throw {status: 402, message: 'data tidak ditemukan'}
      res.status(200).json({status: 200, message: 'Success Show Income', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async showCountPayment(req, res, next) {
    try {
      let {mode} = req.query
      let result = await dbpayment.findAll({order: [['date', 'ASC']]})
      if(result.length == 0) throw {status: 402, message: 'data tidak ditemukan'}
      let data = []
      result.forEach((el, idx, arr) => {
        let year = moment(el.date).year()
        let month = moment(el.date).month()+1
        let payment = el.pay
        let x = data.length
        let y = 0
        for (let i = 0; i < data.length; i++) {
          const el1 = data[i];
          if(el1.year == year){
            x = i
            if(mode == 'month'){
              if(el1) y = el1.data.length
              for (let o = 0; o < el1.data.length; o++) {
                const el2 = el1.data[o];
                if(el2.month == month){
                  payment += el2.payment
                  y = o
                  break
                }
              }
            }else{
              payment += el1.payment
              break
            }
            if(y != 0) break
          }
        }
        if(mode == 'month') {
          if(!data[x]) data[x] = {year, data: []}
          data[x].data[y] = {month, payment}
        }else data[x] = {year, payment}
      });
      res.status(200).json({status: 200, message: 'success show payment', data})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async createPaymentDp(req, res, next) {
    const t = await sq.transaction();
    try {
      let {user_id, package_id, room_id, payment, discount, type_discount, start_kos, date} = req.body
      start_kos = moment(start_kos).utc()
      date = date ? moment(date).utc() : moment().utc()
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      if(!(user_id && package_id && room_id && payment && start_kos && date)) throw {status: 400, message: 'lengkapi data'}
      if(user_id && (/\D/.test(user_id))) throw {status: 400, message: 'user id tidak valid'}
      if(package_id && (/\D/.test(package_id))) throw {status: 400, message: 'package id tidak valid'}
      if(room_id && (/\D/.test(room_id))) throw {status: 400, message: 'room id tidak valid'}
      if(payment && (/\D/.test(payment))) throw {status: 400, message: 'payment tidak valid'}
      if(discount && (/\D/.test(discount))) throw {status: 400, message: 'discount tidak valid'}
      if(discount) discount = Number.parseInt(discount)
      payment = Number.parseInt(payment)
      if(/Invalid date/i.test(start_kos)) throw {status: 400, message: 'start kos tidak valid'}
      if(/Invalid date/i.test(date)) throw {status: 400, message: 'date tidak valid'}

      //cek data user, package, dan room di database
      let result = await sq.query(`
        select 
          u.status_user, 
          u.id as "user_id",
          p.id as "package_id",
          r.id as "room_id",
          r.price,
          p.duration,
          p.discount 
        from "user" u 
          left join package p on p.id = :package_id
          left join room r on r.id = :room_id
        where u.id = :user_id
      `,{
        replacements: {user_id, package_id, room_id},
        type: QueryTypes.SELECT
      })
      if(result.length == 0) throw {status: 402, message: 'user tidak ditemukan'}
      if(!result[0].package_id) throw {status: 402, message: 'package tidak ditemukan'}
      if(!result[0].room_id) throw {status: 402, message: 'room tidak ditemukan'}
      if(result[0].status_user) throw {status: 400, message: 'admin tidak bisa memesan'}

      //chek ruangan kosong atau terisi
      let result1 = await sq.query(`
        select 
          r.price,
          h.start_kos,
          p.duration,
          p.discount 
        from history h 
          inner join package p on h.room_id = :room_id and p.id = h.package_id
          inner join room r on r.id = h.room_id  and
          (timestamp :start_kos::date < (h.start_kos + interval '1 month' * p.duration)::date and (timestamp :start_kos + interval '1 month' * p.duration)::date > h.start_kos::date)
        where h.deleted_at is null and h.pay != -1 
      `,{
        replacements: {room_id, start_kos: start_kos.format()},
        type: QueryTypes.SELECT
      })
      if(result1.length) throw {status: 402, message: 'dalam waktu tersebut kamar masih terisi'}

      //menghitung tagihan yang harus dibayarkan
      let total_payment = result[0].price * result[0].duration
      switch (type_discount) {
        case '%':
          if(discount > 100) throw {status: 400, message: 'discount melebihi 100%'}
          total_payment -= total_payment * (discount / 100)
          break;
        case 'month':
          if(discount > result[0].duration) throw {status: 400, message: 'discount melebihi durasi kos'}
          total_payment -= (result[0].price * discount)
          break;
        case 'nominal':
          if(discount > total_payment) throw {status: 400, message: 'discount melebihi total pembayaran'}
          total_payment -= discount
          break;
        default:
          if(result[0].discount){
            type_discount = 'month'
            discount = result[0].discount
            total_payment -= (result[0].price * result[0].discount)
          }else{
            type_discount = null
            discount = null
          }
          break;
      }
      if(payment > total_payment) throw {status: 400, message: 'pembayaran melebihi jumlah yang harus dibayarkan'}
      if(result[0].price < total_payment && result[0].price > payment) throw {status: 400, message: 'dp minimal ' + result[0].price}

      let resultHistory = await history.create({user_id, package_id, room_id, start_kos, pay: total_payment, type_discount, discount}, {transaction: t})
      if(!resultHistory) throw {status: 400, message: 'gagal melakukan pemesanan'}
      let resultPayment = await dbpayment.create({user_id, history_id: resultHistory.id, pay: payment, date, type: 'dp'}, {transaction: t})
      if(!resultPayment) throw {status: 400, message: 'gagal melakukan pembayaran'}
      await t.commit();
      res.status(200).json({status: 200, message: 'success create payment dp', data: {result, resultHistory, resultPayment}})
    } catch (error) {
      await t.rollback();
      next({status: 500, data: error})
    }
  }
  static async createPaymentAngsuran(req, res, next) {
    try {
      let {history_id, payment, date} = req.body
      date = date ? moment(date).utc() : moment().utc()
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      if(!(history_id && payment && date)) throw {status: 400, message: 'lengkapi data'}
      if((/\D/.test(payment))) throw {status: 400, message: 'payment tidak valid'}
      payment = Number.parseInt(payment)
      if(/Invalid date/i.test(date)) throw {status: 400, message: 'date tidak valid'}

      //mencari tagihan
      let result = await sq.query(`
        select 
          count(p.id) as count_payment, 
          sum(p.pay)::integer as "total_payment", 
          round(h.pay)::integer as "money", 
          round(h.user_id) as "user_id", 
          r.price 
        from history h 
          right join room r ON r.id = h.room_id 
          right join payment p on p.history_id = h.id  
        where h.id = :history_id and h.deleted_at is null
        group by h.id, r.id
      `,{
        replacements: {history_id},
        type: QueryTypes.SELECT
      })
      if(result.length == 0) throw {status: 402, message: 'data pembayaran tidak ditemukan'}
      if(result[0].money - result[0].total_payment == 0) throw {status: 400, message: `pembayaran telah lunas`}
      // if(result[0].count_payment > 2) throw {status: 400, message: `telah membayar 3 kali`}
      if(result[0].count_payment == 1 && result[0].price > payment) throw {status: 400, message: `pembayaran minimal ${result[0].price}`}
      if(result[0].count_payment == 2 && result[0].money - result[0].total_payment > payment) throw {status: 400, message: `pembayaran terakhir diharuskan lunas, sejumlah ${result[0].money - result[0].total_payment}`}
      if(result[0].money - result[0].total_payment < payment) throw {status: 400, message: `pembayaran melebihi total tagihan, sejumlah  ${result[0].money - result[0].total_payment}`}

      result = await dbpayment.create({history_id, user_id: result[0].user_id, date, pay: payment, type: 'angsuran'})
      res.status(200).json({status: 200, message: 'success create angsuran', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async updatePayment(req, res, next) {
    try {
      const {id} = req.params
      let {payment, date} = req.body
      let data = {}
      if(!(id)) throw {status: 400, message: 'masukkan id payment'}
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      if(!(payment || date)) throw {status: 400, message: 'tidak ada yang perlu diupdate'}
      if(payment && (/\D/.test(payment))) throw {status: 400, message: 'payment tidak valid'}
      payment = Number.parseInt(payment)
      if(date){
        date = date ? moment(date).utc() : moment().utc()
        if(/Invalid date/i.test(date)) throw {status: 400, message: 'date tidak valid'}
        data.date = date
      }
      if(payment){
        //mencari tagihan
        let result = await sq.query(`
          select 
            round(p.pay) as "pay", 
            sum(p2.pay) as "total_payment", 
            round(h.pay) as "money", 
            round(h.user_id) as "user_id"
          from payment p 
            inner join payment p2 on p.history_id = p2.history_id and p2.deleted_at is null
            inner join history h on p.history_id = h.id and h.deleted_at is null
          where p.id = :id 
          group by p.id, h.id
        `,{
          replacements: {id},
          type: QueryTypes.SELECT
        })
        if(result.length == 0) throw {status: 402, message: 'data pembayaran tidak ditemukan'}
        // console.log(result)
        if(result[0].money - result[0].pay + payment > result[0].money) throw {status: 400, message: 'pembayaran melebihi total tagihan'}
        data.pay = payment
      }

      let result = await dbpayment.update(data, {where: {id}})
      res.status(200).json({status: 200, message: 'success create angsuran', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async deletePayment(req, res, next) {
    try {
      const {id} = req.params
      if(!id) throw {status: 400, message: 'masukkan id yang akan dihapus'}
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      let result = await dbpayment.destroy({where: {id, type: 'angsuran'}})
      if(result == 0) throw {status: 402, message: 'tidak menemukan data yang akan dihapus'}
      res.status(200).json({status: 200, message: 'success delete payment', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
}

module.exports = Controller