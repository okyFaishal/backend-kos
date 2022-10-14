const sq = require('../../config/connection');
const writeExcel = require('../../helper/write-exel')
const history = require('./model');
const payment = require('../payment/model');
const room = require('../room/model');
const dbpackage = require('../package/model');
const { QueryTypes } = require('sequelize');
const moment = require('moment')


class Controller {
  // static async showHistoryNow(req, res, next) {
  //   try {
  //     let {user_id} = req.query
  //     if(!user_id) throw {status: 400, message: 'masukkan id user'}      
  //     let result = await sq.query(`
  //       select  
  //         h.id as history_id, h.room_id , h.package_id , h.pay , h.type_discount , h.discount , h.start_kos, h.start_kos + interval '1 month' * p.duration - interval '1 day' as "end_kos" , 
  //         p."name" as package_name , p.description , p.duration , p.discount , 
  //         r."name" as room_name , r."size" , r.price , r.build_id, 
  //         b."name" as build_name , b.address 
  //       from history h 
  //         inner join package p on p.deleted_at is null and p.id = h.package_id and h.start_kos + interval '1 month' * p.duration > now()
  //         inner join room r on r.deleted_at is null and r.id = h.room_id 
  //         inner join build b on b.deleted_at is null and b.id = r.build_id
  //       where h.deleted_at is null and h.user_id = :id
  //       limit 1
  //     `, {replacements: {id: user_id}, type: QueryTypes.SELECT})
  //     res.status(200).json({status: 200, message: 'success show history now', data: result})
  //   } catch (error) {
  //     next({status: 500, data: error})
  //   }
  // }
  static async clearRoomByRoom(req, res, next){
    try {
      const {id} = req.params
      if(!id) throw {status: 400, message: 'masukkan ruangan yang akan dikosongkan'}
      if(!req.dataUsers.status_user) throw {status: 400, message: 'tidak memiliki akses'}
      let cek = await sq.query(`select id from history h where h.room_id = :id and now()::date < (start_kos + interval '1 month' * (select p2.duration from package p2 where p2.id = package_id limit 1))::date and now()::date > h.start_kos::date`, {type: QueryTypes.SELECT, replacements: {id}})
      if(cek.length == 0) throw {status: 402, message: 'data tidak ditemukan'}

      let result = await history.update({pay: -1}, {where: {id: cek[0].id}})
      res.status(200).json({status: 200, message: 'Success Clear Room', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async clearRoomByHistory(req, res, next){
    try {
      const {id} = req.params
      if(!id) throw {status: 400, message: 'masukkan ruangan yang akan dikosongkan'}
      if(!req.dataUsers.status_user) throw {status: 400, message: 'tidak memiliki akses'}
      let result = await history.update({pay: -1}, {where: {id}})
      res.status(200).json({status: 200, message: 'Success Clear Room', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async showHistoryClearRoom(req, res, next) {
    try {
      let {history_id, user_id, room_id, package_id, page, limit} = req.query
      req.dataUsers.status_user?true:user_id = req.dataUsers.id
      let result = await sq.query(`
        select 
          count(*) over() as "count", h.id as history_id, u.id as user_id, r.id as room_id, b.id as build_id, p.id as package_id, u.image_profile, 
          u.email , u.username, 
          b."name" as build_name, b.address ,
          r."name" as room_name, r."size" , 
          p.description , p.duration ,
          h.type_discount, h.discount as discount, 
          r.price as "price_room", h.pay as "total_price", sum(p2.pay)::integer as "total_payment", (h.pay - sum(p2.pay))::integer as "deficiency",
          h.start_kos , h.start_kos + interval '1 month' * p.duration - interval '1 day' as "end_kos"
        from history h
          inner join "user" u on u.id = h.user_id 
          inner join room r on r.id = h.room_id 
          inner join build b on b.id = r.build_id
          inner join package p on p.id = h.package_id 
          left join payment p2 on p2.deleted_at is null and p2.history_id  = h.id 
        where h.deleted_at is null and h.pay=-1 ${user_id?'and u.id=:user_id':''} ${room_id?'and r.id=:room_id':''} ${package_id?'and p.id=:package_id':''} ${history_id?'and h.id=:history_id':''}
        group by h.id, u.id, r.id, b.id, p.id
        order by h.updated_at desc
        offset ${page||0} rows
        ${limit?`fetch first ${limit} rows only`:''}
      `,{
        replacements: {history_id, user_id, package_id, room_id, page, limit},
        type: QueryTypes.SELECT
      })
      if(result.length == 0) throw {status: 402, message: 'data tidak ditemukan'}
      let count = 0
      result.forEach((el, idx, arr) => {
        el.total_price = el.price_room * el.duration
        switch (el.type_discount) {
          case '%':
            el.total_price -= el.total_price * (el.discount / 100)
            break;
          case 'month':
            el.total_price -= (el.price_room * el.discount)
            break;
          case 'nominal':
            el.total_price -= el.discount
            break;
        }
        el.deficiency = el.total_price - el.total_payment
        if(count == 0) count = el.count
        arr[idx].count = undefined
      });
      res.status(200).json({status: 200, message: 'success show history', data: {data_history: result, limit, pageNow: page, pageLast: limit ? Math.ceil(count/limit) : undefined, count}})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async showHistoryByUser(req, res, next) {
    try {
      let { page, limit} = req.query
      let result = await sq.query(`
        SELECT DISTINCT on (u.id) u.id AS user_id, h.id AS history_id, r.id AS room_id, b.id AS build_id, p.id AS payment_id,
          u.username, u.email,
          h.start_kos, h.start_kos + interval '1 month' * p2.duration - interval '1 day' AS "end_kos", 
          r."name" AS room_name, r."size" , r.price ,
          b."name" , b.address ,
          p."date" AS date_payment, h.pay AS total_price, p.pay, p4.total_payment, h.pay - p4.total_payment AS deficiency
        FROM "user" u
          INNER JOIN history h ON h.deleted_at is null AND h.user_id = u.id
          INNER JOIN room r ON r.deleted_at is null AND r.id = h.room_id 
          INNER JOIN build b ON b.deleted_at is null AND b.id = r.build_id
          INNER JOIN package p2 ON p2.deleted_at is null AND p2.id = h.package_id 
          INNER JOIN payment p ON p.deleted_at is null AND p.history_id  = h.id
          INNER JOIN (select round(p3.history_id) AS history_id, sum(p3.pay) AS total_payment FROM payment p3 group by p3.history_id) AS p4 on p4.history_id = h.id
        ORDER by u.id, h.start_kos desc, p."date" desc
        OFFSET ${page||0} rows
        ${limit?`fetch first ${limit} rows only`:''}
      `, {type: QueryTypes.SELECT, replacements: {page, limit}})
      if(result.length == 0) throw {status: 402, message: 'Data Tidak DItemukan'}
      let count = (await sq.query(`select count(*) from "user" where status_user = false`, {type: QueryTypes.SELECT}))[0].count
      res.status(200).json({status: 200, message: 'Success Show History By User', data: {data_payment: result, limit, pageNow: page, pageLast: limit ? Math.ceil(count/limit) : undefined, count}})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async showHistory(req, res, next) {
    try {
      let {history_id, user_id, room_id, package_id, page, limit} = req.query
      req.dataUsers.status_user?true:user_id = req.dataUsers.id
      let result = await sq.query(`
        select 
          count(*) over() as "count", h.id as history_id, u.id as user_id, r.id as room_id, b.id as build_id, p.id as package_id, u.image_profile, 
          u.email , u.username, 
          b."name" as build_name, b.address ,
          r."name" as room_name, r."size" , 
          p.description , p.duration ,
          h.type_discount, h.discount as discount, 
          r.price as "price_room", h.pay as "total_price", sum(p2.pay)::integer as "total_payment", (h.pay - sum(p2.pay))::integer as "deficiency",
          h.start_kos , h.start_kos + interval '1 month' * p.duration - interval '1 day' as "end_kos"
        from history h
          inner join "user" u on u.id = h.user_id 
          inner join room r on r.id = h.room_id 
          inner join build b on b.id = r.build_id
          inner join package p on p.id = h.package_id 
          left join payment p2 on p2.deleted_at is null and p2.history_id  = h.id 
        where h.deleted_at is null ${user_id?'and u.id=:user_id':''} ${room_id?'and r.id=:room_id':''} ${package_id?'and p.id=:package_id':''} ${history_id?'and h.id=:history_id':''}
        group by h.id, u.id, r.id, b.id, p.id
        order by h.updated_at desc
        offset ${page||0} rows
        ${limit?`fetch first ${limit} rows only`:''}
      `,{
        replacements: {history_id, user_id, package_id, room_id, page, limit},
        type: QueryTypes.SELECT
      })
      if(result.length == 0) throw {status: 402, message: 'data tidak ditemukan'}
      let count = 0
      result.forEach((el, idx, arr) => {
        if(count == 0) count = el.count
        arr[idx].count = undefined
      });
      res.status(200).json({status: 200, message: 'success show history', data: {data_history: result, limit, pageNow: page, pageLast: limit ? Math.ceil(count/limit) : undefined, count}})
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
        //mencari history
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
        //menghitung tagihan
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
              inner join package p on h.room_id = r.id  and p.id = h.package_id 
            where 
              h.deleted_at is null
              and (timestamp :start_kos::date < (h.start_kos + interval '1 month' * p.duration)::date and (timestamp :start_kos + interval '1 month' * p.duration)::date > h.start_kos::date)
              and h.id != :id
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
              inner join package p on h.room_id = r.id
            where 
              h.deleted_at is null
              and r.id = any(select h2.room_id  from history h2 where id = :id) and
              (timestamp :start_kos::date < (h.start_kos + interval '1 month' * p.duration)::date and (timestamp :start_kos + interval '1 month' * p.duration)::date > h.start_kos::date)
              and h.id != :id
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