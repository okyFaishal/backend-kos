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

class Controller {
  static async exportXlsx(req, res, next) {
    try {
      let {user_id, history_id, pay, date, type} = req.body
      let data = await sq.query(`
        select 
          u.username , u.email , u.status ,
          p."type" as "type payment", p."date" ,
          p2."name" as "package", p2.duration ,
          b.name as "build", b.address,
          r."name" as "room", r."size" , r.price as "price room",
          p.pay as "payment", h.pay as "total price", h.start_kos ,h.start_kos + interval '1 month' * p2.duration as "end_kos"
        from payment p 
          inner join "user" u on u.id = p.user_id
          inner join history h on h.id = p.history_id  
          inner join package p2 on p2.id = h.package_id 
          inner join room r on r.id = h.room_id
          inner join build b on b.id = r.build_id 
        where p.deleted_at is null 
        ${user_id?'and u.id = :user_id':''}  
        ${history_id?'and p.history_id = :history_id':''}
        ${pay?'and p.pay = :pay':''}
        ${date?'and p.date = :date':''}
        ${type?'and p.type = :type':''}
        order by p."date" desc
      `, {type: QueryTypes.SELECT, replacements: {user_id, history_id, pay, date, type}})
      // Buat Workbook
      const fileName = "payment";
      let wb = XLSX.utils.book_new();
      wb.Props = {
        Title: fileName,
        Author: "pero",
        CreatedDate: new Date(),
      };
      // Buat Sheet
      wb.SheetNames.push("Sheet 1");
      // Buat Sheet dengan Data
      let ws = XLSX.utils.json_to_sheet(data);
      wb.Sheets["Sheet 1"] = ws;
      // Cek apakah folder downloadnya ada
      const downloadFolder = path.resolve(__dirname, "../../asset/downloads");
      if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder);
      }
      XLSX.writeFile(wb, `${downloadFolder}${path.sep}${fileName}.xls`);
      res.download(`${downloadFolder}${path.sep}${fileName}.xls`);
      // res.status(200).json({status: 200, message: 'success show payment', data})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async showPayment(req, res, next) {
    try {
      let {user_id, history_id, build_id, pay, date, type, mode} = req.query
      let result = await sq.query(`
        select 
          ${mode != 'export'?'u.id as user_id, p.id as payment_id, h.id as history_id, p2.id as package_id, r.id as room_id, b.id as build_id, ':''}
          u.username , u.email , u.status ,
          p."type" as "type payment", p."date" ,
          p2."name" as "package", p2.duration ,
          b.name as "build", b.address,
          r."name" as "room", r."size", r.price as "price_room",
          h.type_discount, h.discount, h.pay as "total_price", 
          p.pay as "payment", sum(p3.pay) as "total_payment", (h.pay - sum(p3.pay)) as "deficiency", p."type", p."date" ,
          h.start_kos ,h.start_kos + interval '1 month' * p2.duration - interval '1 day' as "end_kos"
        from payment p 
          inner join "user" u on u.id = p.user_id
          inner join history h on h.id = p.history_id  
          inner join package p2 on p2.id = h.package_id 
          inner join room r on r.id = h.room_id
          inner join build b on b.id = r.build_id 
          left join payment p3 on p3.history_id = h.id and p3."date" <= p."date" 
        where p.deleted_at is null 
        ${user_id?'and u.id = :user_id':''}  
        ${history_id?'and p.history_id = :history_id':''}
        ${build_id?'and b.build_id = :build_id':''}
        ${type?'and p.type = :type':''}
        group by p.id, u.id, h.id, p2.id, r.id, b.id
        order by p.date desc
      `, {type: QueryTypes.SELECT, replacements: {user_id, history_id, pay, date, type}})
      if(result.length == 0) throw {status: 402, message: 'data tidak ditemukan'}
      switch (mode) {
        case 'export':
          // let write = writeExcel('payment', result)
          // console.log(write.error)
          // if(!write.status) throw {status: 500, data: write.error, message: 'gagal membuat file excel'}
          // res.download(write.fileName);
          const fileName = "payment";
          let wb = XLSX.utils.book_new();
          wb.Props = {
            Title: fileName,
            Author: "pero",
            CreatedDate: new Date(),
          };
          // Buat Sheet
          wb.SheetNames.push("Sheet 1");
          // Buat Sheet dengan Data
          let ws = XLSX.utils.json_to_sheet(result);
          wb.Sheets["Sheet 1"] = ws;
          // Cek apakah folder downloadnya ada
          const downloadFolder = path.resolve(__dirname, "../../asset/downloads");
          if (!fs.existsSync(downloadFolder)) {
            fs.mkdirSync(downloadFolder);
          }
          XLSX.writeFile(wb, `${downloadFolder}${path.sep}${fileName}.xls`);
          res.download(`${downloadFolder}${path.sep}${fileName}.xls`);
          break;
        default:
          res.status(200).json({status: 200, message: 'success show payment', data: result})
          break;
      }
      
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
      if(!(user_id && package_id && room_id && payment && discount && type_discount && start_kos && date)) throw {status: 400, message: 'lengkapi data'}
      if(user_id && (/\D/.test(user_id))) throw {status: 400, message: 'user id tidak valid'}
      if(package_id && (/\D/.test(package_id))) throw {status: 400, message: 'package id tidak valid'}
      if(room_id && (/\D/.test(room_id))) throw {status: 400, message: 'room id tidak valid'}
      if(payment && (/\D/.test(payment))) throw {status: 400, message: 'payment tidak valid'}
      if(discount && (/\D/.test(discount))) throw {status: 400, message: 'discount tidak valid'}
      payment = Number.parseInt(payment)
      discount = Number.parseInt(discount)
      if(/Invalid date/i.test(start_kos)) throw {status: 400, message: 'start kos tidak valid'}
      if(/Invalid date/i.test(date)) throw {status: 400, message: 'date tidak valid'}

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
          left join package p on p.deleted_at is null and p.id = :package_id
          left join room r on r.deleted_at is null and r.id = :room_id
        where u.id = :user_id
      `,{
        replacements: {user_id, package_id, room_id},
        type: QueryTypes.SELECT
      })
      if(result.length == 0) throw {status: 402, message: 'room tidak ditemukan'}
      if(!result[0].package_id) throw {status: 402, message: 'package tidak ditemukan'}
      if(!result[0].room_id) throw {status: 402, message: 'room tidak ditemukan'}
      if(result[0].status_user) throw {status: 400, message: 'admin tidak bisa memesan'}

      //chek room
      let result1 = await sq.query(`
        select 
          r.price,
          h.start_kos,
          p.duration,
          p.discount 
        from history h 
          inner join package p on h.room_id = :room_id and p.id = h.package_id and p.deleted_at is null
          inner join room r on r.id = h.room_id  and h.deleted_at is null and
              (timestamp :start_kos < h.start_kos + interval '1 month' * p.duration and timestamp :start_kos + interval '1 month' * p.duration > h.start_kos) 
      `,{
        replacements: {room_id, start_kos: start_kos.format()},
        type: QueryTypes.SELECT
      })
      if(result1.length) throw {status: 402, message: 'dalam waktu tersebut kamar masih terisi'}

      let total_payment = result[0].price * result[0].duration
      switch (type_discount) {
        case '%':
          if(discount > 100) throw {status: 400, message: 'discount melebihi 100%'}
          data.pay -= data.pay * (discount / 100)
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

      let result = await sq.query(`
        select sum(p.pay) as "total_payment", round(h.pay) as "money", round(h.user_id) as "user_id"
        from history h right join payment p on p.history_id = h.id and p.deleted_at is null
        where h.id = :history_id and h.deleted_at is null
        group by h.id 
      `,{
        replacements: {history_id},
        type: QueryTypes.SELECT
      })
      if(result.length == 0) throw {status: 402, message: 'data pembayaran tidak ditemukan'}
      if(result[0].money - result[0].total_payment < payment) throw {status: 400, message: 'pembayaran melebihi total tagihan'}

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
        let result = await sq.query(`
          select round(p.pay) as "pay", sum(p2.pay) as "total_payment", round(h.pay) as "money", round(h.user_id) as "user_id"
          from payment p 
            inner join payment p2 on p.history_id = p2.history_id 
            inner join history h on p.history_id = h.id 
          where p.id = :id 
          group by p.id, h.id
        `,{
          replacements: {id},
          type: QueryTypes.SELECT
        })
        if(result.length == 0) throw {status: 402, message: 'data pembayaran tidak ditemukan'}
        console.log(result)
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