const sq = require('../../config/connection');
const history = require('./model');
const payment = require('../payment/model');
const room = require('../room/model');
const dbpackage = require('../package/model');
const { QueryTypes } = require('sequelize');
const moment = require('moment')


class Controller {
  static async showHistory(req, res) {
    try {
      let {user_id, room_id, package_id} = req.body
      let where = {}
      if(req.dataUsers.status_user){
        if(user_id || room_id || package_id){
          if(user_id) where.user_id = user_id
          if(room_id) where.room_id = room_id
          if(package_id) where.package_id = package_id
        }else where = undefined
      }else{
        where = {user_id: req.dataUsers.id}
      }

      let result = await history.findAll({order: [['updated_at', 'DESC']], where})
      res.status(200).json({ status: 200, message: 'success show room', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async updateHistory(req, res) {
    try {
      let {id} = req.params
      let {package_id, room_id, total_payment, start_kos} = req.body
      if(!(package_id || room_id || total_payment || start_kos)) throw 'tidak ada data yang diupdate'
      if(!id) throw 'masukkan id history yang akan dubah'
      let result = {}
      const data = {}

      if(package_id){ //package
        if((/\D/.test(package_id))) throw 'package id tidak valid'
        result.package = await dbpackage.findOne({where: {id: package_id}})
        if(!result.package) throw 'package tidak ditemukan'
        data.package_id = package_id
      }
      if(room_id){ //room
        if((/\D/.test(room_id))) throw 'room id tidak valid'
        result.room = await room.findOne({where: {id: room_id}})
        if(!result.room) throw 'room tidak ditemukan'
        data.room_id = room_id
      }
      if(total_payment){ //total payment
        if((/\D/.test(total_payment))) throw 'payment tidak valid'
        result.payment = await sq.query(`select sum(p.pay) as total_payment from payment p where history_id = :id and deleted_at is null group by history_id limit 1`, {replacements: {id}, type: QueryTypes.SELECT})
        if(result.payment.length == 0) throw 'payment tidak ditemukan'
        if(total_payment < result.payment[0].total_payment) throw 'total payment lebih rendah dari pembayaran yang sudah dibayarkan'
        data.pay = total_payment
      }
      if(start_kos){ //start kos
        start_kos = moment(start_kos).utc().format()
        if(/Invalid date/i.test(start_kos)) throw 'start kos tidak valid'
        if(room_id){
          result.start_kos = await sq.query(`
            select start_kos, start_kos + interval '1 month' * p.duration as "end_kos", p.duration, r.id, h.id
            from history h
              inner join room r on r.id = :room_id and r.id = h.room_id and r.deleted_at is null
              inner join package p on h.room_id = r.id  and p.id = h.package_id and p.deleted_at is null
            where 
              ((timestamp :start_kos >= start_kos and timestamp :start_kos <= start_kos + interval '1 month' * p.duration) or
              (timestamp :start_kos + interval '1 month' * p.duration > start_kos and timestamp :start_kos + interval '1 month' * p.duration < start_kos + interval '1 month' * p.duration) or
              (start_kos < timestamp :start_kos and start_kos + interval '1 month' * p.duration > timestamp :start_kos + interval '1 month' * p.duration)) and 
              h.id != :id
            limit 1
          `, {
            replacements: {start_kos, room_id: room_id, id}, 
            type: QueryTypes.SELECT
          })
          console.log(result.start_kos)
          if(result.start_kos.length) throw 'kamar masih dihuni'
        }else{
          result.start_kos = await sq.query(`
            select start_kos, start_kos + interval '1 month' * p.duration as "end_kos", p.duration, r.id
            from history h
              inner join room r on r.id = h.room_id and r.deleted_at is null
              inner join package p on h.room_id = r.id and p.deleted_at is null
            where 
              r.id = any(select h2.room_id  from history h2 where id = :id) and
              ((timestamp :start_kos >= start_kos and timestamp :start_kos <= start_kos + interval '1 month' * p.duration) or
              (timestamp :start_kos + interval '1 month' * p.duration > start_kos and timestamp :start_kos + interval '1 month' * p.duration < start_kos + interval '1 month' * p.duration) or
              (start_kos < timestamp :start_kos and start_kos + interval '1 month' * p.duration > timestamp :start_kos + interval '1 month' * p.duration)) and 
              h.id != :id
            limit 1
          `, {
            replacements: {start_kos, id}, 
            type: QueryTypes.SELECT
          })
          console.log(result.start_kos)
          if(result.start_kos.length) throw 'kamar masih dihuni'
        }
        data.start_kos = start_kos
      }

      
      result = await history.update(data, {where: {id}})
      if(result[0] == 0) throw 'tidak menemukan data yang akan diupdate'
      res.status(200).json({ status: 200, message: 'success create payment dp', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async deleteHistory(req, res) {
    try {
      const {id} = req.params
      if(!id) throw 'masukkan id yang akan dihapus'
      if(!req.dataUsers.status_user) throw 'tidak memiliki akses'
      let result = await history.destroy({where: {id}})
      if(result == 0) throw 'tidak menemukan data yang akan dihapus'
      res.status(200).json({ status: 200, message: 'success delete history', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
}

module.exports = Controller