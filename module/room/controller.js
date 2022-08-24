const sq = require('../../config/connection');
const room = require('./model');
const build = require('../build/model');
const { QueryTypes } = require('sequelize');


class Controller {
  static async showRoom(req, res) {
    try {
      const {build_id} = req.body
      let where = build_id ? {build_id} : undefined
      let result = await room.findAll({order: [['updated_at', 'DESC']], where})
      res.status(200).json({ status: 200, message: 'success show room', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async createRoom(req, res) {
    try {
      const {build_id} = req.params
      const {name, size, price} = req.body

      if(!req.dataUsers.status_user) throw 'tidak memiliki akses'
      if(!(name && size && price)) throw 'lengkapi data'
      if(price && (/\D/.test(price))) throw 'price tidak valid'

      let result = await build.findOne({where: {id: build_id}})
      if(!result) throw 'build tidak ditemukan'

      result = await room.create({build_id, name, size, price})
      res.status(200).json({ status: 200, message: 'success create room', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async updateRoom(req, res) {
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
  static async deleteRoom(req, res) {
    try {
      const {id} = req.params
      if(!id) throw 'masukkan id yang akan dihapus'
      if(!req.dataUsers.status_user) throw 'tidak memiliki akses'
      let result = await room.destroy({where: {id}})
      if(result == 0) throw 'tidak menemukan data yang akan dihapus'
      res.status(200).json({ status: 200, message: 'success delete room', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
}

module.exports = Controller