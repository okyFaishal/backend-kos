const sq = require('../../config/connection');
const dbpackage = require('./model');
const { QueryTypes, Op } = require('sequelize');


class Controller {
  static async showPackage(req, res, next){
    try {
      let {package_id, page, limit, name, order} = req.query
      if(page && !limit) throw {status: 403, message: 'masukkan limit'}
      let offset = page?((page - 1) * limit):undefined

      let where = {}
      if(package_id) where.id = package_id
      if(name) where.name = {[Op.like]:`%${name}%`}

      let result = await dbpackage.findAll({where, offset, limit, order: [[order||'updated_at', 'ASC']]})
      let count = await dbpackage.count()
      res.status(200).json({status: 200, message: 'success show package', data: {data_package: result, limit, pageNow: page, pageLast: limit ? Math.ceil(count/limit) : undefined, count}})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async createPackage(req, res, next){
    try {
      let {name, description, discount, duration} = req.body
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      if(!(name && duration)) throw {status: 400, message: 'lengkapi data'}
      if(duration){
        if(/\D/.test(duration)) throw {status: 400, message: 'duration tidak valid'}
        duration = Number.parseInt(duration)
      }
      if(discount){
        if(/\D/.test(discount)) throw {status: 400, message: 'discount tidak valid'}
        discount = Number.parseInt(discount)
        if(discount > duration) throw {status: 400, message: 'discount tidak valid'}
      } 

      let result = await dbpackage.create({name, description, discount, duration})
      res.status(200).json({status: 200, message: 'success create package', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async updatePackage(req, res, next){
    try {
      const {id} = req.params
      let {name, description, discount, duration} = req.body
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      if(!id) throw {status: 400, message: 'masukkan id yang akan diupdate'}
      if(!(name || description || discount || duration)) throw {status: 400, message: 'tidak ada yang diupdate'}
      if(duration) {
        if(/\D/.test(duration)) throw {status: 400, message: 'duration tidak valid'}
        duration = Number.parseInt(duration)
      }
      if(discount) {
        if(/\D/.test(discount)) throw {status: 400, message: 'discount tidak valid'}
        discount = Number.parseInt(discount)
        if(discount > duration) throw {status: 400, message: 'discount tidak valid'}
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