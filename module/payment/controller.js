const sq = require('../../config/connection');
// const {sequelize} = require('../../config/connection');
const dbpayment = require('./model');
const history = require('../history/model');
const package = require('../package/model');
const room = require('../room/model');
const { QueryTypes } = require('sequelize');
// const sequelize = require('sequelize');
const moment = require('moment')


class Controller {
  static async showPayment(req, res, next) {
    try {
      let {user_id, history_id, pay, date, type} = req.body
      let result = await sq.query(`
        select 
          u.image_profile , u.username , u.email , u.status,
          p.pay , p."type" , p."date" 
        from payment p 
          inner join "user" u on u.id = p.user_id 
        where p.deleted_at is null 
        ${user_id?'and u.id = :user_id':''}  
        ${history_id?'and p.history_id = :history_id':''}
        ${pay?'and p.pay = :pay':''}
        ${date?'and p.date = :date':''}
        ${type?'and p.type = :type':''}
        order by p.updated_at desc
      `, {type: QueryTypes.SELECT, replacements: {user_id, history_id, pay, date, type}})
      // let result = await dbpayment.findAll({order: [['updated_at', 'DESC']], where})
      res.status(200).json({status: 200, message: 'success show payment', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async createPaymentDp(req, res, next) {
    const t = await sq.transaction();
    try {
      let {user_id, package_id, room_id, payment, total_payment, start_kos, date} = req.body
      start_kos = moment(start_kos).utc()
      date = date ? moment(date).utc() : moment().utc()
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      if(!(user_id && package_id && room_id && payment && total_payment && start_kos && date)) throw {status: 400, message: 'lengkapi data'}
      if(user_id && (/\D/.test(user_id))) throw {status: 400, message: 'user id tidak valid'}
      if(package_id && (/\D/.test(package_id))) throw {status: 400, message: 'package id tidak valid'}
      if(room_id && (/\D/.test(room_id))) throw {status: 400, message: 'room id tidak valid'}
      if(payment && (/\D/.test(payment))) throw {status: 400, message: 'payment tidak valid'}
      if(total_payment && (/\D/.test(total_payment))) throw {status: 400, message: 'total payment tidak valid'}
      payment = Number.parseInt(payment)
      total_payment = Number.parseInt(total_payment)
      if(payment > total_payment) throw {status: 400, message: 'pembayaran melebihi jumlah yang harus dibayarkan'}
      if(/Invalid date/i.test(start_kos)) throw {status: 400, message: 'start kos tidak valid'}
      if(/Invalid date/i.test(date)) throw {status: 400, message: 'date tidak valid'}

      let result = await sq.query(`
        select 
          u.status_user,
          u.id as "user_id",
          p.id as "package_id",
          r.id as "room_id",
          r.price,
          h.start_kos,
          p.duration 
        from "user" u
          full join package p on p.id = :package_id and p.deleted_at is null
          full join room r on r.id = :room_id and r.deleted_at is null
          full join history h on h.package_id = p.id and h.room_id = r.id and h.deleted_at is null and 
            (timestamp :start_kos >= h.start_kos and timestamp :start_kos <= h.start_kos + interval '1 month' * p.duration) or
            (timestamp :start_kos + interval '1 month' * p.duration > h.start_kos and timestamp :start_kos + interval '1 month' * p.duration < h.start_kos + interval '1 month' * p.duration) or
            (h.start_kos < timestamp :start_kos and h.start_kos + interval '1 month' * p.duration > timestamp :start_kos + interval '1 month' * p.duration)
          where u.id = :user_id
        order by h.start_kos desc
      `,{
        replacements: {user_id, package_id, room_id, start_kos: start_kos.format()},
        type: QueryTypes.SELECT
      })
      // throw {status: 400, message: result}
      if(result.length == 0) throw {status: 402, message: 'user, package, dan room tidak ditemukan'}
      if(!result[0].user_id) throw {status: 402, message: 'user tidak ditemukan'}
      if(!result[0].package_id) throw {status: 402, message: 'package tidak ditemukan'}
      if(!result[0].room_id) throw {status: 402, message: 'room tidak ditemukan'}
      if(result[0].price >= total_payment && result[0].price > payment) throw {status: 400, message: 'dp minimal ' + payment}
      if(result[0].status_user) throw {status: 400, message: 'admin tidak bisa memesan'}
      if(result[0].start_kos) throw {status: 400, message: 'dalam waktu tersebut kamar masih terisi'}

      let resultHistory = await history.create({user_id, package_id, room_id, start_kos, pay: total_payment}, {transaction: t})
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