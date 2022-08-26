
const sq = require('../../config/connection');
const user = require('../user/model');
const build = require('./model');
const kirimEmail = require('../../helper/kirimEmail')
const {verifyToken} = require('../../helper/jwt')
const {hashPassword, compare} = require('../../helper/bcrypt');
const { QueryTypes } = require('sequelize');


class Controller {
  static async showBuild(req, res, next) {
    try {
      let result = await build.findAll({order: [['updated_at', 'DESC']]})
      next({status: 200, message: 'success show build', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async createBuild(req, res, next) {
    try {
      const {name, adress} = req.body
      if(!req.dataUsers.status_user) next({status: 403, message: 'Tidak Memiliki Akses'})
      if(!(name && adress)) next({status: 400, message: 'Lengkapi Data'})
      let result = await build.create({name, adress})
      next({status: 200, message: 'success create build', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async updateBuild(req, res, next) {
    try {
      const {id} = req.params
      const {name, adress} = req.body
      if(!req.dataUsers.status_user) next({status: 403, message: 'Tidak Memiliki Akses'})
      if(!id) next({status: 400, message: 'Masukkan Id Build Yang Akan Di Update'})
      if(!(name || adress)) next({status: 400, message: 'Tidak Ada Yang Di Update'})
      let result = await build.update({name, adress}, {where: {id}})
      if(result[0] == 0) next({status: 400, message: 'tidak menemukan data yang akan diupdate'})
      // result = await build.findOne({where: {id}})
      next({status: 200, message: 'success update build', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async deleteBuild(req, res, next) {
    try {
      const {id} = req.params
      if(!id) next({status: 400, message: 'Masukkan Id Build Yang Akan Di Hapus'})
      if(!req.dataUsers.status_user) next({status: 403, message: 'Tidak Memiliki Akses'})
      let result = await build.destroy({where: {id}})
      if(result == 0) next({status: 400, message: 'tidak menemukan data yang akan dihapus'})
      next({status: 200, message: 'success delete build', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
}

module.exports = Controller