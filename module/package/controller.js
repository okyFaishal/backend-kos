const sq = require('../../config/connection');
const dbpackage = require('./model');
const { QueryTypes } = require('sequelize');


class Controller {
  static async showPackage(req, res, next){
    try {
      let result = await dbpackage.findAll({order: [['updated_at', 'DESC']]})
      res.status(200).json({status: 200, message: 'success show package', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async createPackage(req, res, next){
    try {
      const {name, description, discount, duration} = req.body
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      if(!(name && duration)) throw {status: 400, message: 'lengkapi data'}
      if(duration && /\D/.test(duration)) throw {status: 400, message: 'duration tidak valid'}
      if(discount && (/\D/.test(discount) || discount > duration)) throw {status: 400, message: 'discount tidak valid'}

      let result = await dbpackage.create({name, description, discount, duration})
      res.status(200).json({status: 200, message: 'success create package', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async updatePackage(req, res, next){
    try {
      const {id} = req.params
      const {name, description, discount, duration} = req.body
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      if(!id) throw {status: 400, message: 'masukkan id yang akan diupdate'}
      if(!(name || description || discount || duration)) throw {status: 400, message: 'tidak ada yang diupdate'}
      if(duration && /\D/.test(duration)) throw {status: 400, message: 'duration tidak valid'}
      if(discount) {
        if(/\D/.test(discount) || (duration && discount > duration)) throw {status: 400, message: 'discount tidak valid'}
        //cek database duration
        let result = await dbpackage.findOne({where: {id}})
        if(!result) throw {status: 400, message: 'tidak menemukan data yang akan diupdate'}
        if(result.duration < discount) throw {status: 400, message: 'discount tidak valid'}
      }

      let result = await dbpackage.update({name, description, discount, duration}, {where: {id}})
      if(result[0] == 0) throw {status: 400, message: 'tidak menemukan data yang akan diupdate'}
      res.status(200).json({status: 200, message: 'success update package', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async deletePackage(req, res, next){
    try {
      const {id} = req.params
      if(!id) throw {status: 400, message: 'masukkan id yang akan dihapus'}
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      let result = await dbpackage.destroy({where: {id}})
      if(result == 0) throw {status: 400, message: 'tidak menemukan data yang akan dihapus'}
      res.status(200).json({status: 200, message: 'success delete package', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
}

module.exports = Controller