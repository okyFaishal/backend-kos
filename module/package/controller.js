const sq = require('../../config/connection');
const dbpackage = require('./model');
const { QueryTypes } = require('sequelize');


class Controller {
  static async showPackage(req, res) {
    try {
      let result = await dbpackage.findAll({order: [['updated_at', 'DESC']]})
      res.status(200).json({ status: 200, message: 'success show package', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async createPackage(req, res) {
    try {
      const {name, description, discount, duration} = req.body
      if(!req.dataUsers.status_user) throw 'tidak memiliki akses'
      if(!(name && duration)) throw 'lengkapi data'
      if(duration && /\D/.test(duration)) throw 'duration tidak valid'
      if(discount && (/\D/.test(discount) || discount > duration)) throw 'discount tidak valid'

      let result = await dbpackage.create({name, description, discount, duration})
      res.status(200).json({ status: 200, message: 'success create package', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async updatePackage(req, res) {
    try {
      const {id} = req.params
      const {name, description, discount, duration} = req.body
      if(!req.dataUsers.status_user) throw 'tidak memiliki akses'
      if(!id) throw 'masukkan id yang akan diupdate'
      if(!(name || description || discount || duration)) throw 'tidak ada yang diupdate'
      if(duration && /\D/.test(duration)) throw 'duration tidak valid'
      if(discount) {
        if(/\D/.test(discount) || (duration && discount > duration)) throw 'discount tidak valid'
        //cek database duration
        let result = await dbpackage.findOne({where: {id}})
        if(!result) throw 'tidak menemukan data yang akan diupdate'
        if(result.duration < discount) throw 'discount tidak valid'
      }

      let result = await dbpackage.update({name, description, discount, duration}, {where: {id}})
      if(result[0] == 0) throw 'tidak menemukan data yang akan diupdate'
      res.status(200).json({ status: 200, message: 'success update package', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async deletePackage(req, res) {
    try {
      const {id} = req.params
      if(!id) throw 'masukkan id yang akan dihapus'
      if(!req.dataUsers.status_user) throw 'tidak memiliki akses'
      let result = await dbpackage.destroy({where: {id}})
      if(result == 0) throw 'tidak menemukan data yang akan dihapus'
      res.status(200).json({ status: 200, message: 'success delete package', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
}

module.exports = Controller