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
      let where = {}
      if(req.dataUsers.status_user){
        if(user_id || history_id || pay || date || type){
          if(user_id) where.user_id = user_id
          if(history_id) where.history_id = history_id
          if(pay) where.pay = pay
          if(date) where.date = date
          if(type) where.type = type
        }else where = undefined
      }else{
        where = {user_id: req.dataUsers.id}
      }
      let result = await dbpayment.findAll({order: [['updated_at', 'DESC']], where})
      next({status: 200, message: 'success show payment', data: result})
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
      if(!req.dataUsers.status_user) next({status: 403, message: 'tidak memiliki akses'})
      if(!(user_id && package_id && room_id && payment && total_payment && start_kos && date)) next({status: 400, message: 'lengkapi data'})
      if(user_id && (/\D/.test(user_id))) next({status: 400, message: 'user id tidak valid'})
      if(package_id && (/\D/.test(package_id))) next({status: 400, message: 'package id tidak valid'})
      if(room_id && (/\D/.test(room_id))) next({status: 400, message: 'room id tidak valid'})
      if(payment && (/\D/.test(payment))) next({status: 400, message: 'payment tidak valid'})
      if(total_payment && (/\D/.test(total_payment))) next({status: 400, message: 'total payment tidak valid'})
      payment = Number.parseInt(payment)
      total_payment = Number.parseInt(total_payment)
      if(payment > total_payment) next({status: 400, message: 'pembayaran melebihi jumlah yang harus dibayarkan'})
      if(/Invalid date/i.test(start_kos)) next({status: 400, message: 'start kos tidak valid'})
      if(/Invalid date/i.test(date)) next({status: 400, message: 'date tidak valid'})

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
      // next({status: 400, message: result})
      if(result.length == 0) next({status: 400, message: 'user, package, dan room tidak ditemukan'})
      if(!result[0].user_id) next({status: 400, message: 'user tidak ditemukan'})
      if(!result[0].package_id) next({status: 400, message: 'package tidak ditemukan'})
      if(!result[0].room_id) next({status: 400, message: 'room tidak ditemukan'})
      if(result[0].price >= total_payment && result[0].price > payment) next({status: 400, message: 'dp minimal ' + payment})
      if(result[0].status_user) next({status: 400, message: 'admin tidak bisa memesan'})
      if(result[0].start_kos) next({status: 400, message: 'dalam waktu tersebut kamar masih terisi'})

      let resultHistory = await history.create({user_id, package_id, room_id, start_kos, pay: total_payment}, {transaction: t})
      if(!resultHistory) next({status: 400, message: 'gagal melakukan pemesanan'})
      let resultPayment = await dbpayment.create({user_id, history_id: resultHistory.id, pay: payment, date, type: 'dp'}, {transaction: t})
      if(!resultPayment) next({status: 400, message: 'gagal melakukan pembayaran'})
      await t.commit();
      next({status: 200, message: 'success create payment dp', data: {result, resultHistory, resultPayment}})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async createPaymentAngsuran(req, res, next) {
    try {
      let {user_id, history_id, payment, date} = req.body
      date = date ? moment(date).utc() : moment().utc()
      if(!req.dataUsers.status_user) next({status: 403, message: 'tidak memiliki akses'})
      if(!(user_id && history_id && pay && date)) next({status: 400, message: 'lengkapi data'})
      if(user_id && (/\D/.test(user_id))) next({status: 400, message: 'user id tidak valid'})
      if(payment && (/\D/.test(payment))) next({status: 400, message: 'payment tidak valid'})
      payment = Number.parseInt(payment)
      if(/Invalid date/i.test(start_kos)) next({status: 400, message: 'start kos tidak valid'})
      if(/Invalid date/i.test(date)) next({status: 400, message: 'date tidak valid'})



      if(!req.dataUsers.status_user) next({status: 403, message: 'tidak memiliki akses'})
      if(!id) next({status: 400, message: 'masukkan id yang akan diupdate'})
      if(!(name || size || price)) next({status: 400, message: 'tidak ada yang diupdate'})
      if(price && (/\D/.test(price))) next({status: 400, message: 'price tidak valid'})

      let result = await room.update({name, size, price}, {where: {id}})
      if(result[0] == 0) next({status: 402, message: 'tidak menemukan data yang akan diupdate'})
      next({status: 200, message: 'success update room', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async updatePayment(req, res, next) {
    try {
      const {id} = req.params
      const {name, size, price} = req.body

      if(!req.dataUsers.status_user) next({status: 403, message: 'tidak memiliki akses'})
      if(!id) next({status: 400, message: 'masukkan id yang akan diupdate'})
      if(!(name || size || price)) next({status: 400, message: 'tidak ada yang diupdate'})
      if(price && (/\D/.test(price))) next({status: 400, message: 'price tidak valid'})

      let result = await room.update({name, size, price}, {where: {id}})
      if(result[0] == 0) next({status: 402, message: 'tidak menemukan data yang akan diupdate'})
      next({status: 200, message: 'success update room', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async deletePayment(req, res, next) {
    try {
      const {id} = req.params
      if(!id) next({status: 400, message: 'masukkan id yang akan dihapus'})
      if(!req.dataUsers.status_user) next({status: 403, message: 'tidak memiliki akses'})
      let result = await dbpayment.destroy({where: {id}})
      if(result == 0) next({status: 402, message: 'tidak menemukan data yang akan dihapus'})
      next({status: 200, message: 'success delete payment', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
}

module.exports = Controller