
const sq = require('../../config/connection');
const user = require('../user/model');
const otp = require('./model');
const kirimEmail = require('../../helper/kirimEmail')
const {hashPassword, compare} = require('../../helper/bcrypt');
const {generateToken, verifyToken} = require('../../helper/jwt');
const { QueryTypes } = require('sequelize');


class Controller {
  static async createOtp(req, res, next) {
    try {
      let {email, type} = req.body 
      const {token} = req.headers
      let id, dataUsers
      if(token) dataUsers = await user.findOne({where: {id: verifyToken(token).id}})

      if(!(type)) throw {status: 400, message: 'Masukkan Type'}

      if(type == 'verify email'){ //verify email
        if(!dataUsers) throw {status: 403, message: 'Belum Login'}
        id = dataUsers.id
        email = dataUsers.email
      }else if(type == 'forgot password'){ //lupa password
        if(dataUsers) {id = dataUsers.id; email = dataUsers.email;}
        else if(email){
          let result = await user.findOne({where: {email}})
          if(!result) throw {status: 402, message: 'Email Tidak Ditemukan'}
          id = result.id
        }else throw {status: 400, message: 'Masukkan Email'}
      }else throw {status: 400, message: 'Type Tidak Valid'}

      const valid_until = new Date(new Date().getTime() + (1000 * 60 * 10)).toISOString()
      let codeOtp = 0
      do {
        codeOtp = Math.ceil(Math.random() * 1000000)
      } while (codeOtp < 100000 || codeOtp > 999999)
      kirimEmail.kirim(email, `request otp`, `<h2 style="text-align: center;">code otp</h2><h1 style="text-align: center">${codeOtp}</h1>`)
      let result = await otp.create({user_id: id, type, valid_until, otp: codeOtp})

      res.status(200).json({status: 200, message: 'success create otp'})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async checkOtp(req, res, next) {
    try {      
      // const dataUsers = verifyToken(req.headers.token)
      // if(!dataUsers) throw {status: 400, message: 'Belum Login'}
      // let {email, type, code_otp, password} = req.body 
      // email = email ? email : dataUsers.email

      // if(!(code_otp && type)) throw {status: 400, message: 'Data Tidak Lengkap'}
      // if(!/forgot password|verify email/i.test(type)) throw {status: 400, message: 'Type Tidak Valid'}

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
      // if(result.length == 0) throw {status: 400, message: `silahkan mengirimkan otp ${type}`}

      // if(type == "verify email"){

      // }

      let {email, type, code_otp, password} = req.body 
      const {token} = req.headers
      let id, dataUsers
      if(token) dataUsers = await user.findOne({where: {id: verifyToken(token).id}})

      if(!(type && code_otp)) throw {status: 400, message: 'Data Tidak Lengkap'}

      if(type == 'verify email'){ //verify email
        if(!dataUsers) throw {status: 403, message: 'Belum Login'}
        id = dataUsers.id
        let result = await otp.findOne({where: {user_id: id, type: 'verify email'}, order: [['valid_until', 'DESC']]})

        if(!result) throw {status: 402, message: 'Silahkan Mengirimkan Otp Verifikasi Email'}
        if(result.otp != code_otp) throw {status: 402, message: 'Silahkan Kirim Otp Terbaru'}

        await user.update({verify_email: true}, {where: {id}})
        await otp.destroy({where: {user_id: id, type: 'verify email'}})
      }else if(type == 'forgot password'){ //lupa password
        if(!password) throw {status: 400, message: 'Masukkan Password'}
        if(dataUsers) id = dataUsers.id
        else if(email){
          let result = await user.findOne({where: {email}})
          if(!result) throw {status: 402, message: 'Email Tidak Ditemukan'}
          id = result.id
        }else throw {status: 400, message: 'Masukkan Email'}

        let result = await otp.findOne({where: {user_id: id, type: 'forgot password'}, order: [['valid_until', 'DESC']]})
        if(!result) throw {status: 400, message: 'Silahkan Mengirimkan Otp Verifikasi Email'}
        if(result.otp != code_otp) throw {status: 402, message: 'Silahkan Kirim Otp Terbaru'}

        password = hashPassword(password)
        
        await user.update({password}, {where: {id}})
        await otp.destroy({where: {user_id: id, type: 'forgot password'}})
      }else throw {status: 400, message: 'Type Tidak Valid'}

      let data = await user.findOne({where: {id: dataUsers.id}})
      data = {...data.dataValues, password: undefined, status_user: data.status_user?'admin':'user'}  //tentukan admin / user
      console.log(data)
      const newToken = generateToken(data) //buat token
      res.status(200).json({status: 200, message: `berhasil ${type}`, data: {...data, token: newToken}})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
}

module.exports = Controller