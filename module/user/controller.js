
const sq = require('../../config/connection');
const user = require('./model');
const {hashPassword, compare} = require('../../helper/bcrypt');
const {generateToken, verifyToken} = require('../../helper/jwt');
const { QueryTypes } = require('sequelize');


class Controller {
  static async register(req, res) {
    try {
      const {username, email, contact, nik, birth_place, religion, gender, emergency_contact, emergency_name, status, name_company, name_university, major, degree, generation} = req.body
      if(!(req.body.password && req.files.image_ktp && req.body.birth_date && username && email && contact && nik && birth_place && religion && gender && status)) throw 'Lengkapi Data'
      const birth_date = new Date(req.body.birth_date)
      const password = hashPassword(req.body.password)
      const image_profile = req.files.image_profile ? req.files.image_profile[0].filename : undefined
      const image_ktp = req.files.image_ktp[0].filename

      if(/\D/.test(contact)) throw 'contact tidak valid'
      else if(/\D/.test(emergency_contact)) throw 'emergency contact tidak valid'
      else if(/\D/.test(nik)) throw 'nik tidak valid'
      else if(/\D/.test(generation)) throw 'generation tidak valid'
      else if(!/\w+@\w+\.\w+/.test(email)) throw 'email tidak valid'
      else if(!/mahasiswa|kerja/.test(status)) throw 'status tidak valid'
      else if(birth_date == 'Invalid Date') throw 'birth date tidak valid'
      
      const result = await user.create({image_profile, image_ktp, username, email, password, contact, nik, birth_place, birth_date, religion, gender, emergency_contact, emergency_name, status, name_company, name_university, major, degree, generation})
      const token = generateToken(result.dataValues)

      // const hapus = await sq.query(`DELETE FROM "user" WHERE id=${result.id}`, {type: QueryTypes.DELETE})
      // console.log(hapus)
      res.status(200).json({ status: 200, message: 'success create acount', data: {...result.dataValues, token}})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async login(req, res) {
    try {
      const {email, password} = req.body 
      if(!(password && email)) throw 'Lengkapi Data'
      let dataCek = await user.findOne({where:{email}}) //ambil data sesuai email

      if(!dataCek) throw 'Email Belum Terdaftar'
      else if(!compare(password, dataCek.password)) throw 'Password Tidak Cocok'

      dataCek = {...dataCek.dataValues, status_user: dataCek.status_user?'admin':'user', password: undefined}  //tentukan admin / user
      const token = generateToken(dataCek) //buat token
      res.status(200).json({ status: 200, message: 'success login', data: {...dataCek, token}})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async updateProfile(req, res) {
    try {
      const {username, email, contact, nik, birth_place, religion, gender, emergency_contact, emergency_name, status, name_company, name_university, major, degree, generation} = req.body
      const birth_date = req.body.birth_date ? new Date(req.body.birth_date) : undefined
      const image_profile = req.files.image_profile ? req.files.image_profile[0].filename : undefined
      const image_ktp = req.files.image_ktp ? req.files.image_ktp[0].filename : undefined
      if(email) var verify_email = false

      if(contact && /\D/.test(contact)) throw 'contact tidak valid'
      if(emergency_contact && /\D/.test(emergency_contact)) throw 'emergency contact tidak valid'
      if(nik && /\D/.test(nik)) throw 'nik tidak valid'
      if(generation && /\D/.test(generation)) throw 'generation tidak valid'
      if(email && !/\w+@\w+\.\w+/.test(email)) throw 'email tidak valid'
      if(status && !/mahasiswa|kerja/.test(status)) throw 'status tidak valid'
      if(birth_date && birth_date == 'Invalid Date') throw 'birth date tidak valid'

      //update
      let result = await user.update(
        {username, email, verify_email, contact, nik, birth_place, birth_date, religion, gender, emergency_contact, emergency_name, status, name_company, name_university, major, degree, generation, image_profile, image_ktp}, 
        {where: {id: req.dataUsers.id}}
      )
      //show new data
      result = await user.findOne({attributes: {exclude: ['password']}, where: {id: req.dataUsers.id}})

      result = {...result.dataValues, status_user: result.status_user?'admin':'user', password: undefined}  //tentukan admin / user
      const token = generateToken(result) //buat token
      res.status(200).json({ status: 200, message: 'success update profile', data: {...result, token}})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async deleteAcount(req, res) {
    try {
      let id = req.dataUsers.id //mengambil id sendiri (admin dan user)
      if(req.dataUsers.status_user && req.body.id) id = req.body.id //mengambil id dari body (khusus admin)

      let result = await user.destroy({where: {id}})
      if(result == 0) throw 'id tidak ditemukan'

      res.status(200).json({ status: 200, message: 'berhasil dihapus'})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
}

module.exports = Controller



