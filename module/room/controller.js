const sq = require('../../config/connection');
const room = require('./model');
const build = require('../build/model');
const { QueryTypes } = require('sequelize');


class Controller {
  static async showRoom(req, res, next){
    try {
      const {build_id} = req.body
      let where = build_id ? {build_id} : undefined
      let result = await room.findAll({order: [['updated_at', 'DESC']], where})
      res.status(200).json({status: 200, message: 'success show room', data: result})
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