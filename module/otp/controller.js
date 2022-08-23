
const sq = require('../../config/connection');
const user = require('../user/model');
const otp = require('./model');
const kirimEmail = require('../../helper/kirimEmail')
const {verifyToken} = require('../../helper/jwt')
const {hashPassword, compare} = require('../../helper/bcrypt');
const { QueryTypes } = require('sequelize');


class Controller {
  static async createOtp(req, res) {
    try {
      let {email, type} = req.body 
      const {token} = req.headers
      let id, dataUsers
      if(token) dataUsers = await user.findOne({where: {id: verifyToken(token).id}})

      if(!(type)) throw 'Masukkan Type'

      if(type == 'verify email'){ //verify email
        if(!dataUsers) throw 'Belum Login'
        id = dataUsers.id
        email = dataUsers.email
      }else if(type == 'forgot password'){ //lupa password
        if(dataUsers) {id = dataUsers.id; email = dataUsers.email;}
        else if(email){
          let result = await user.findOne({where: {email}})
          if(!result) throw 'Email Tidak Ditemukan'
          id = result.id
        }else throw 'Masukkan Email'
      }else throw 'Type Tidak Valid'

      const valid_until = new Date(new Date().getTime() + (1000 * 60 * 10)).toISOString()
      let codeOtp = 0
      do {
        codeOtp = Math.ceil(Math.random() * 1000000)
      } while (codeOtp < 100000 || codeOtp > 999999)
      kirimEmail.kirim(email, `request otp`, `<h2 style="text-align: center;">code otp</h2><h1 style="text-align: center">${codeOtp}</h1>`)
      let result = await otp.create({user_id: id, type, valid_until, otp: codeOtp})

      res.status(200).json({ status: 200, message: 'success create otp'})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
  static async checkOtp(req, res) {
    try {      
      // const dataUsers = verifyToken(req.headers.token)
      // if(!dataUsers) throw 'Belum Login'
      // let {email, type, code_otp, password} = req.body 
      // email = email ? email : dataUsers.email

      // if(!(code_otp && type)) throw 'Data Tidak Lengkap'
      // if(!/forgot password|verify email/i.test(type)) throw 'Type Tidak Valid'

      // let result = await sq.query(`
      //   SELECT *
      //   FROM otp o 
      //     INNER JOIN "user" u ON u.email = :email AND o.otp = :otp AND u.id = o.user_id 
      // `,{
      //   replacements: {email, otp: code_otp},
      //   type: QueryTypes.SELECT
      // })
      // console.log("result ==============")
      // console.log(result)
      // if(result.length == 0) throw `silahkan mengirimkan otp ${type}`

      // if(type == "verify email"){

      // }

      let {email, type, code_otp, password} = req.body 
      const {token} = req.headers
      let id, dataUsers
      if(token) dataUsers = await user.findOne({where: {id: verifyToken(token).id}})

      if(!(type && code_otp)) throw 'Data Tidak Lengkap'

      if(type == 'verify email'){ //verify email
        if(!dataUsers) throw 'Belum Login'
        id = dataUsers.id
        let result = await otp.findOne({where: {user_id: id, type: 'verify email'}, order: [['valid_until', 'DESC']]})

        if(!result) throw 'Silahkan Mengirimkan Otp Verifikasi Email'
        if(result.otp != code_otp) throw 'Silahkan Kirim Otp Terbaru'

        await user.update({verify_email: true}, {where: {id}})
        await otp.destroy({where: {user_id: id, type: 'verify email'}})
      }else if(type == 'forgot password'){ //lupa password
        if(!password) throw 'Masukkan Password'
        if(dataUsers) id = dataUsers.id
        else if(email){
          let result = await user.findOne({where: {email}})
          if(!result) throw 'Email Tidak Ditemukan'
          id = result.id
        }else throw 'Masukkan Email'

        let result = await otp.findOne({where: {user_id: id, type: 'forgot password'}, order: [['valid_until', 'DESC']]})
        if(!result) throw 'Silahkan Mengirimkan Otp Verifikasi Email'
        if(result.otp != code_otp) throw 'Silahkan Kirim Otp Terbaru'

        password = hashPassword(password)
        
        await user.update({password}, {where: {id}})
        await otp.destroy({where: {user_id: id, type: 'forgot password'}})
      }else throw 'Type Tidak Valid'

      res.status(200).json({ status: 200, message: `berhasil ${type}`})
    } catch (error) {
      console.log(error)
      res.status(200).json({ status: 200, message: error})
    }
  }
}

module.exports = Controller