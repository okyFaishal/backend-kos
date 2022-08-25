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
  static async showPayment(req, res) {
    try {
      let {user_id, room_id, package_id} = req.body
      if(!req.dataUsers.statusUsers) {user_id = req.dataUsers.id; room_id = undefined; package_ = undefinedid}
      let where = user_id || room_id || package_id ? {user_id, room_id, package_id} : undefined
      let result = await room.findAll({order: [['updated_at', 'DESC']], where})
      res.status(200).json({ status: 200, message: 'success show room', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async createPaymentDp(req, res) {
    const t = await sq.transaction();
    try {
      let {user_id, package_id, room_id, payment, total_payment, start_kos, date} = req.body
      start_kos = moment(start_kos).add(1, 'minutes').utc()
      date = moment(date).add(1, 'minutes').utc()
      if(!req.dataUsers.status_user) throw 'tidak memiliki akses'
      if(!(user_id && package_id && room_id && payment && total_payment && start_kos && date)) throw 'lengkapi data'
      if(user_id && (/\D/.test(user_id))) throw 'user id tidak valid'
      if(package_id && (/\D/.test(package_id))) throw 'package id tidak valid'
      if(room_id && (/\D/.test(room_id))) throw 'room id tidak valid'
      if(payment && (/\D/.test(payment))) throw 'payment tidak valid'
      if(total_payment && (/\D/.test(total_payment))) throw 'total payment tidak valid'
      payment = Number.parseInt(payment)
      total_payment = Number.parseInt(total_payment)
      if(payment > total_payment) throw 'pembayaran melebihi jumlah yang harus dibayarkan'
      if(/Invalid date/i.test(start_kos)) throw 'start kos tidak valid'
      if(date < moment(new Date()).utc() || /Invalid date/i.test(date)) throw 'date tidak valid'
      if(start_kos < date) throw 'start kos dan date tidak valid'

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
          full join package p on p.id = :package_id
          full join room r on r.id = :room_id
          full join history h on h.package_id = p.id and h.room_id = r.id 
        where u.id = :user_id
        order by h.start_kos desc
        limit 1
      `,{
        replacements: {user_id, package_id, room_id},
        type: QueryTypes.SELECT
      })
      if(result.length == 0) throw 'user, package, dan room tidak ditemukan'
      if(!result[0].user_id) throw 'user tidak ditemukan'
      if(!result[0].package_id) throw 'package tidak ditemukan'
      if(!result[0].room_id) throw 'room tidak ditemukan'
      if(result[0].price >= total_payment && result[0].price > payment) throw 'dp minimal ' + payment
      if(result[0].status_user) throw 'admin tidak bisa memesan'
      if(result[0].start_kos && (moment((result[0].start_kos)).add(result[0].duration, 'months').utc() > moment(start_kos).utc())) throw 'dalam waktu tersebut kamar masih terisi'

      let resultHistory = await history.create({user_id, package_id, room_id, start_kos, pay: total_payment}, {transaction: t})
      if(!resultHistory) throw 'gagal melakukan pemesanan'
      let resultPayment = await dbpayment.create({user_id, history_id: resultHistory.id, pay: payment, date, type: 'dp'}, {transaction: t})
      if(!resultPayment) throw 'gagal melakukan pembayaran'
      await t.commit();
      res.status(200).json({ status: 200, message: 'success create payment dp', data: result})
    } catch (error) {
      await t.rollback();
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async updatePayment(req, res) {
    try {
      const {id} = req.params
      const {name, size, price} = req.body

      if(!req.dataUsers.status_user) throw 'tidak memiliki akses'
      if(!id) throw 'masukkan id yang akan diupdate'
      if(!(name || size || price)) throw 'tidak ada yang diupdate'
      if(price && (/\D/.test(price))) throw 'price tidak valid'

      let result = await room.update({name, size, price}, {where: {id}})
      if(result[0] == 0) throw 'tidak menemukan data yang akan diupdate'
      res.status(200).json({ status: 200, message: 'success update room', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async deletePayment(req, res) {
    try {
      const {id} = req.params
      if(!id) throw 'masukkan id yang akan dihapus'
      if(!req.dataUsers.status_user) throw 'tidak memiliki akses'
      let result = await room.destroy({where: {id}})
      if(result == 0) throw 'tidak menemukan data yang akan dihapus'
      res.status(200).json({ status: 200, message: 'success delete history', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
}

module.exports = Controller