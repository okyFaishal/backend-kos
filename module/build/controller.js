
const sq = require('../../config/connection');
const user = require('../user/model');
const build = require('./model');
const kirimEmail = require('../../helper/kirimEmail')
const {verifyToken} = require('../../helper/jwt')
const {hashPassword, compare} = require('../../helper/bcrypt');
const { QueryTypes } = require('sequelize');


class Controller {
  static async showBuild(req, res) {
    try {
      let result = await build.findAll({order: [['updated_at', 'DESC']]})
      res.status(200).json({ status: 200, message: 'success show build', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async createBuild(req, res) {
    try {
      const {name, adress} = req.body
      if(!req.dataUsers.status_user) throw 'Tidak Memiliki Akses'
      if(!(name && adress)) throw 'Lengkapi Data'
      let result = await build.create({name, adress})
      res.status(200).json({ status: 200, message: 'success create build', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async updateBuild(req, res) {
    try {
      const {id} = req.params
      const {name, adress} = req.body
      if(!req.dataUsers.status_user) throw 'Tidak Memiliki Akses'
      if(!id) throw 'Masukkan Id Build Yang Akan Di Update'
      if(!(name || adress)) throw 'Tidak Ada Yang Di Update'
      let result = await build.update({name, adress}, {where: {id}})
      if(result[0] == 0) throw 'tidak menemukan data yang akan diupdate'
      // result = await build.findOne({where: {id}})
      res.status(200).json({ status: 200, message: 'success update build', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async deleteBuild(req, res) {
    try {
      const {id} = req.params
      if(!id) throw 'Masukkan Id Build Yang Akan Di Hapus'
      if(!req.dataUsers.status_user) throw 'Tidak Memiliki Akses'
      let result = await build.destroy({where: {id}})
      if(result == 0) throw 'tidak menemukan data yang akan dihapus'
      res.status(200).json({ status: 200, message: 'success delete build', data: result})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
}

module.exports = Controller