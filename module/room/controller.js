const sq = require('../../config/connection');
const room = require('./model');
const build = require('../build/model');
const { QueryTypes } = require('sequelize');


class Controller {
  static async showRoom(req, res, next){
    try {
      const {build_id, room_id, page, limit, name} = req.query
      let result = await sq.query(`
        select r.id as "room_id", r.build_id, u.id as user_id, b.name as "build_name", b.address, r.name, r.size, r.price, u.username , u.email , u.status , h.start_kos ,h.start_kos + interval '1 month' * p.duration - interval '1 day' as "end_kos"
        from room r 
          inner join build b on b.id = r.build_id and b.deleted_at is null
          left join history h on h.room_id = r.id and h.deleted_at is null and start_kos < now() and h.start_kos + interval '1 month' * (select p2.duration from package p2 where p2.id = h.package_id and p2.deleted_at is null limit 1) > now()
          left join package p on p.id = h.package_id and p.deleted_at is null
          left join "user" u on u.id = h.user_id 
        where r.deleted_at is null ${build_id?'and b.id = :build_id':''} ${room_id?'and r.id = :room_id':''} ${name?'and r.name LIKE :name':''}
        order by r."name" ASC
        offset ${page||0} rows
        ${limit?`fetch first ${limit} rows only`:''}
      `, {type: QueryTypes.SELECT, replacements: {build_id, room_id, name}})
      let data = []
      result.forEach(elResult => {
        let cek = true
        data.forEach((elData, i, arr) => {
          if(elData.name == elResult.build_name){
            data[i].rooms.push({...elResult, ...{build_name: undefined}})
            cek = false
          }
        })
        if(cek) data.push({name: elResult.build_name, rooms: [{...elResult, ...{build_name: undefined}}]})
      })
      // let {package_id, page, limit, name} = req.query
      // if(page && !limit) throw {status: 403, message: 'masukkan limit'}
      // let offset = page?((page - 1) * limit):undefined
      // let where = {}
      // if(package_id) where.id = package_id
      // if(name) where.name = {[Op.like]:`%${name}%`}
      // let result = await dbpackage.findAll({where, offset, limit, order: [['updated_at', 'DESC']]})
      res.status(200).json({status: 200, message: 'success show room', data})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async createRoom(req, res, next){
    try {
      const {build_id, name, size, price} = req.body

      if(!req.dataUsers.status_user) throw {status: 400, message: 'tidak memiliki akses'}
      if(!(build_id, name && size && price)) throw {status: 400, message: 'lengkapi data'}
      if(price && (/\D/.test(price))) throw {status: 400, message: 'price tidak valid'}

      let result = await build.findOne({where: {id: build_id}})
      if(!result) throw {status: 400, message: 'build tidak ditemukan'}

      result = await room.create({build_id, name, size, price})
      res.status(200).json({status: 200, message: 'success create room', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async updateRoom(req, res, next){
    try {
      const {id} = req.params
      const {name, size, price} = req.body

      if(!req.dataUsers.status_user) throw {status: 400, message: 'tidak memiliki akses'}
      if(!id) throw {status: 400, message: 'masukkan id yang akan diupdate'}
      if(!(name || size || price)) throw {status: 400, message: 'tidak ada yang diupdate'}
      if(price && (/\D/.test(price))) throw {status: 400, message: 'price tidak valid'}

      let result = await room.update({name, size, price}, {where: {id}})
      if(result[0] == 0) throw {status: 400, message: 'tidak menemukan data yang akan diupdate'}
      res.status(200).json({status: 200, message: 'success update room', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async deleteRoom(req, res, next){
    try {
      const {id} = req.params
      if(!id) throw {status: 400, message: 'masukkan id yang akan dihapus'}
      if(!req.dataUsers.status_user) throw {status: 400, message: 'tidak memiliki akses'}
      let result = await room.destroy({where: {id}})
      if(result == 0) throw {status: 400, message: 'tidak menemukan data yang akan dihapus'}
      res.status(200).json({status: 200, message: 'success delete room', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
}

module.exports = Controller