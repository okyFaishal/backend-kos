
const sq = require('../../config/connection');
const user = require('../user/model');
const build = require('./model');
const kirimEmail = require('../../helper/kirimEmail')
const {verifyToken} = require('../../helper/jwt')
const {hashPassword, compare} = require('../../helper/bcrypt');
const { QueryTypes, Op } = require('sequelize');


class Controller {
  static async showBuild(req, res, next) {
    try {
      let {build_id, page, limit, name, order} = req.query
      if(page && !limit) throw {status: 403, message: 'masukkan limit'}
      let offset = page?((page - 1) * limit):undefined

      let where = {}
      if(build_id) where.id = build_id
      if(name) where.name = {[Op.like]:`%${name}%`}

      let result = await build.findAll({where, offset, limit, order: [[order||'updated_at', 'ASC']]})
      let count = await build.count()
      res.status(200).json({status: 200, message: 'success show build', data: {data_kamar: result, limit, page, count}})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async createBuild(req, res, next) {
    try {
      const {name, address} = req.body
      if(!req.dataUsers.status_user) throw {status: 403, message: 'Tidak Memiliki Akses'}
      if(!(name && address)) throw {status: 400, message: 'Lengkapi Data'}
      let result = await build.create({name, address})
      res.status(200).json({status: 200, message: 'success create build', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async updateBuild(req, res, next) {
    try {
      const {id} = req.params
      const {name, address} = req.body
      if(!req.dataUsers.status_user) throw {status: 403, message: 'Tidak Memiliki Akses'}
      if(!id) throw {status: 400, message: 'Masukkan Id Build Yang Akan Di Update'}
      if(!(name || address)) throw {status: 400, message: 'Tidak Ada Yang Di Update'}
      let result = await build.update({name, address}, {where: {id}})
      if(result[0] == 0) throw {status: 400, message: 'tidak menemukan data yang akan diupdate'}
      res.status(200).json({status: 200, message: 'success update build', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async deleteBuild(req, res, next) {
    try {
      const {id} = req.params
      if(!id) throw {status: 400, message: 'Masukkan Id Build Yang Akan Di Hapus'}
      if(!req.dataUsers.status_user) throw {status: 403, message: 'Tidak Memiliki Akses'}
      let result = await build.destroy({where: {id}})
      if(result == 0) throw {status: 400, message: 'tidak menemukan data yang akan dihapus'}
      res.status(200).json({status: 200, message: 'success delete build', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
}

module.exports = Controller