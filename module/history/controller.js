const sq = require('../../config/connection');
const writeExcel = require('../../helper/write-exel')
const history = require('./model');
const payment = require('../payment/model');
const room = require('../room/model');
const dbpackage = require('../package/model');
const { QueryTypes } = require('sequelize');
const moment = require('moment')


class Controller {
  static async showHistory(req, res, next) {
    try {
      let {user_id, room_id, package_id, mode} = req.query
      // req.dataUsers.status_user?true:user_id = req.dataUsers.id

      let result = await sq.query(`
        select 
          ${mode=='export'?'':'h.id as history_id, u.id as user_id, r.id as room_id, b.id as build_id, p.id as package_id, u.image_profile, '}
          u.email ,
          b."name" as build_name, b.address ,
          r."name" as room_name, r."size" , 
          p.description , p.duration ,
          h.type_discount, h.discount as discount, 
          r.price as "price_room", h.pay as "total_price", sum(p2.pay)::integer as "total_payment", (h.pay - sum(p2.pay))::integer as "deficiency",
          h.start_kos , h.start_kos + interval '1 month' * p.duration - interval '1 day' as "end_kos"
        from history h
          inner join "user" u on u.id = h.user_id 
          inner join room r on r.deleted_at is null and r.id = h.room_id 
          inner join build b on b.deleted_at is null and b.id = r.build_id
          inner join package p on p.deleted_at is null and p.id = h.package_id 
          left join payment p2 on p2.deleted_at is null and p2.history_id  = h.id 
        where h.deleted_at is null ${user_id?'and u.id=:user_id':''} ${room_id?'and r.id=:room_id':''} ${package_id?'and p.id=:package_id':''}
        group by h.id, u.id, r.id, b.id, p.id
        order by h.updated_at desc
      `,{
        replacements: {user_id, package_id, room_id},
        type: QueryTypes.SELECT
      })
      // throw {status: 400, message: result}
      if(result.length == 0) throw {status: 402, message: 'data tidak ditemukan'}
      switch (mode) {
        case 'export':
          let write = await writeExcel('history', result)
          if(!write.status) throw {status: 500, data: write.error, message: 'gagal membuat file excel'}
          res.download(write.data);
          break;
        default:
          res.status(200).json({status: 200, message: 'success show history', data: result})
          break;
      }
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async updateHistory(req, res, next) {
    try {
      let {id} = req.params
      let {package_id, room_id, total_payment, start_kos, type_discount, discount} = req.body
      if(!(package_id || room_id || total_payment || start_kos || type_discount || discount)) throw {status: 400, message: 'tidak ada data yang diupdate'}
      if(!id) throw {status: 400, message: 'masukkan id history yang akan dubah'}
      let result = {}
      const data = {}

      if(type_discount && discount){
        let result = await sq.query(`
          select r.price , p.duration 
          from history h 
            inner join room r on r.id = h.room_id
            inner join package p on p.id = h.package_id 
          where h.id = :id
        `,{
          replacements: {id},
          type: QueryTypes.SELECT
        })
        if(result.length == 0) throw {status: 402, message: 'history tidak ditemukan'}
        data.type_discount = type_discount
        data.discount = discount
        data.pay = (result[0].price * result[0].duration) 
        switch (type_discount) {
          case '%':
            if(discount > 100) throw {status: 400, message: 'discount melebihi 100%'}
            data.pay -= data.pay * (discount / 100)
            break;
          case 'month':
            if(discount > result[0].duration) throw {status: 400, message: 'discount melebihi durasi kos'}
            data.pay -= (result[0].price * discount)
            break;
          case 'nominal':
            if(discount > data.pay) throw {status: 400, message: 'discount melebihi total pembayaran'}
            data.pay -= discount
            break;
          default:
            throw {status: 400, message: 'type discount tidak valid'}
        }
      }

      if(package_id){ //package
        if((/\D/.test(package_id))) throw {status: 400, message: 'package id tidak valid'}
        result.package = await dbpackage.findOne({where: {id: package_id}})
        if(!result.package) throw {status: 400, message: 'package tidak ditemukan'}
        data.package_id = package_id
      }
      if(room_id){ //room
        if((/\D/.test(room_id))) throw {status: 400, message: 'room id tidak valid'}
        result.room = await room.findOne({where: {id: room_id}})
        if(!result.room) throw {status: 400, message: 'room tidak ditemukan'}
        data.room_id = room_id
      }
      if(total_payment){ //total payment
        if((/\D/.test(total_payment))) throw {status: 400, message: 'payment tidak valid'}
        result.payment = await sq.query(`select sum(p.pay) as total_payment from payment p where history_id = :id and deleted_at is null group by history_id limit 1`, {replacements: {id}, type: QueryTypes.SELECT})
        if(result.payment.length == 0) throw {status: 400, message: 'payment tidak ditemukan'}
        if(total_payment < result.payment[0].total_payment) throw {status: 400, message: 'total payment lebih rendah dari pembayaran yang sudah dibayarkan'}
        data.pay = total_payment
      }
      if(start_kos){ //start kos
        start_kos = moment(start_kos).utc().format()
        if(/Invalid date/i.test(start_kos)) throw {status: 400, message: 'start kos tidak valid'}
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
          if(result.start_kos.length) throw {status: 400, message: 'kamar masih dihuni'}
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
          if(result.start_kos.length) throw {status: 400, message: 'kamar masih dihuni'}
        }
        data.start_kos = start_kos
      }
      
      result = await history.update(data, {where: {id}})
      if(result[0] == 0) throw {status: 400, message: 'tidak menemukan data yang akan diupdate'}
      res.status(200).json({status: 200, message: 'success create payment dp', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async deleteHistory(req, res, next) {
    try {
      const {id} = req.params
      if(!id) throw {status: 400, message: 'masukkan id yang akan dihapus'}
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      let result = await history.destroy({where: {id}})
      if(result == 0) throw {status: 400, message: 'tidak menemukan data yang akan dihapus'}
      res.status(200).json({status: 200, message: 'success delete history', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
}

module.exports = Controller