
const sq = require('../../config/connection');
const user = require('./model');
const {hashPassword, compare} = require('../../helper/bcrypt');
const {generateToken, verifyToken} = require('../../helper/jwt');
const { QueryTypes, Op} = require('sequelize');


class Controller {
  static async showUser(req, res, next) {
    try {
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      let {user_id, page, limit, username, order} = req.query
      if(page && !limit) throw {status: 403, message: 'masukkan limit'}
      let offset = page?((page - 1) * limit):undefined
      let where = {}
      if(user_id) where.id = user_id
      if(username) where.username = {[Op.like]:`%${username}%`}
      let result = await user.findAll({where, offset, limit, order: [[order||'username', 'ASC']]})
      let count = await user.count()
      res.status(200).json({status: 200, message: 'success show user', data: {data_user: result, limit, page, count}})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async showUserKos(req, res, next) {
    try {
      const {build_id} = req.query
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      let result = await sq.query(`
        select 
          u.id, u.image_profile, u.username, u.email, u.contact, u.nik, u.status,
          h.id as "history_id", h.pay, h.start_kos ,h.start_kos + interval '1 month' - interval '1 day' * p.duration as "end_kos",
          r.id as "room_id", r.name, r.size, r.price, 
          b.id as "build_id", b.name, b.address, 
          p.id as "package_id", p.name, p.description, p.discount, p.duration, 
          sum(p2.pay) as "count_payment"
        from "user" u 
          inner join history h on h.user_id = u.id
          inner join room r on r.id = h.room_id
          inner join build b on b.id = r.build_id
          inner join package p on p.id = h.package_id
          inner join payment p2 on p2.history_id = h.id
        where start_kos < now() and h.start_kos + interval '1 month' * p.duration > now() ${build_id?'and build_id = :build_id':''}
        group by u.id, h.id, r.id, b.id, p.id
      `, {replacements: {build_id}, type: QueryTypes.SELECT})
      res.status(200).json({status: 200, message: 'success show user', data: result})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async showDetailUser(req, res, next) {
    try {
      const user_id = req.params.id
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      let result = await sq.query(`
        select 
          h.id as history_id, u.id as user_id, r.id as room_id, b.id as build_id, p.id as package_id, 
          u.image_profile, u.image_profile , u.status_user , u.username , u.email , u.verify_email , u.contact , u.nik , u.birth_place , u.birth_date , u.religion , u.gender , u.emergency_name , u.emergency_contact , u.status , u.name_company , u.name_university , u.major , u."degree" , u.generation , 
          b."name" as build_name, b.address ,
          r."name" as room_name, r."size" , 
          p.description , p.duration ,
          h.type_discount, h.discount as discount, 
          r.price as "price_room", h.pay as "total_price", sum(p2.pay)::integer as "total_payment", (h.pay - sum(p2.pay))::integer as "deficiency",
          h.start_kos , h.start_kos + interval '1 month' * p.duration - interval '1 day' as "end_kos"
        from history h
          inner join "user" u on u.id = h.user_id and u.id = :user_id
          inner join room r on r.deleted_at is null and r.id = h.room_id 
          inner join build b on b.deleted_at is null and b.id = r.build_id
          inner join package p on p.deleted_at is null and p.id = h.package_id 
          left join payment p2 on p2.deleted_at is null and p2.history_id  = h.id 
        where h.deleted_at is null
        group by h.id, u.id, r.id, b.id, p.id
        order by start_kos  desc
      `, {replacements: {user_id}, type: QueryTypes.SELECT})
      let dataUser = {}
      let dataHistory = []
      let data = []
      if(!dataUser.id) dataUser = {id: result[0].user_id, image_profile: result[0].image_profile, image_profile: result[0].image_profile, status_user: result[0].status_user, username: result[0].username, email: result[0].email, verify_email: result[0].verify_email, contact: result[0].contact, nik: result[0].nik, birth_place: result[0].birth_place, birth_date: result[0].birth_date, religion: result[0].religion, gender: result[0].gender, emergency_name: result[0].emergency_name, emergency_contact: result[0].emergency_contact, status: result[0].status, name_company: result[0].name_company, name_university: result[0].name_university, major: result[0].major, degree: result[0].degree, generation: result[0].generation}
        
      result.forEach(elResult => {
        dataHistory.push({...elResult, ...{image_profile: undefined, image_profile: undefined, status_user: undefined, username: undefined, email: undefined, verify_email: undefined, contact: undefined, nik: undefined, birth_place: undefined, birth_date: undefined, religion: undefined, gender: undefined, emergency_name: undefined, emergency_contact: undefined, status: undefined, name_company: undefined, name_university: undefined, major: undefined, degree: undefined, generation: undefined}})
      })
      res.status(200).json({status: 200, message: 'success show user', data: {dataUser, dataHistory}})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async register(req, res, next) {
    try {
      const {username, email, contact, nik, birth_place, religion, gender, emergency_contact, emergency_name, status, name_company, name_university, major, degree, generation} = req.query
      if(!(req.body.password && req.files.image_ktp && req.body.birth_date && username && email && contact && nik && birth_place && religion && gender && status)) throw {status: 400, message: 'Lengkapi Data'}
      const birth_date = new Date(req.body.birth_date)
      const password = hashPassword(req.body.password)
      const image_profile = req.files.image_profile ? req.files.image_profile[0].filename : undefined
      const image_ktp = req.files.image_ktp[0].filename

      if(/\D/.test(contact)) throw {status: 400, message: 'contact tidak valid'}
      else if(/\D/.test(emergency_contact)) throw {status: 400, message: 'emergency contact tidak valid'}
      else if(/\D/.test(nik)) throw {status: 400, message: 'nik tidak valid'}
      else if(/\D/.test(generation)) throw {status: 400, message: 'generation tidak valid'}
      else if(!/\w+@\w+\.\w+/.test(email)) throw {status: 400, message: 'email tidak valid'}
      else if(!/mahasiswa|kerja/.test(status)) throw {status: 400, message: 'status tidak valid'}
      else if(birth_date == 'Invalid Date') throw {status: 400, message: 'birth date tidak valid'}
      
      const result = await user.create({image_profile, image_ktp, username, email, password, contact, nik, birth_place, birth_date, religion, gender, emergency_contact, emergency_name, status, name_company, name_university, major, degree, generation})
      result.dataValues.password = undefined
      const token = generateToken(result.dataValues)

      res.status(200).json({status: 200, message: 'success create acount', data: {...result.dataValues, token}})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async registerAdmin(req, res, next) {
    try {
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      const {username, email, contact, nik, birth_place, religion, gender, emergency_contact, emergency_name, status, name_company, name_university, major, degree, generation} = req.body
      if(!(req.body.password && username && email)) throw {status: 400, message: 'Lengkapi Data'}
      const birth_date = req.body.birth_date?new Date(req.body.birth_date):new Date()
      const password = hashPassword(req.body.password)
      const image_profile = req.files.image_profile ? req.files.image_profile[0].filename : undefined
      const image_ktp = req.files.image_ktp ? req.files.image_ktp[0].filename : 'default.jpg'

      if(contact && /\D/.test(contact)) throw {status: 400, message: 'contact tidak valid'}
      else if(emergency_contact && /\D/.test(emergency_contact)) throw {status: 400, message: 'emergency contact tidak valid'}
      else if(nik && /\D/.test(nik)) throw {status: 400, message: 'nik tidak valid'}
      else if(generation && /\D/.test(generation)) throw {status: 400, message: 'generation tidak valid'}
      else if(email && !/\w+@\w+\.\w+/.test(email)) throw {status: 400, message: 'email tidak valid'}
      else if(status && !/mahasiswa|kerja/.test(status)) throw {status: 400, message: 'status tidak valid'}
      else if(birth_date && birth_date == 'Invalid Date') throw {status: 400, message: 'birth date tidak valid'}
      
      const result = await user.create({status_user: true, image_profile, image_ktp, username, email, password, contact: contact||123456789012, nik: nik||12345678912345678, birth_place: birth_place||"indonesia", birth_date, religion: religion||"admin", gender: gender||"admin", emergency_contact, emergency_name, status: status||"admin", name_company, name_university, major, degree, generation})
      result.dataValues.password = undefined
      const token = generateToken(result.dataValues)

      res.status(200).json({status: 200, message: 'success create acount admin', data: {...result.dataValues, token}})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async login(req, res, next) {
    try {
      const {email, password} = req.body 
      if(!(password && email)) throw {status: 400, message: 'Lengkapi Data'}
      let dataCek = await user.findOne({where:{email}}) //ambil data sesuai email

      if(!dataCek) throw {status: 402, message: 'Email Belum Terdaftar'}
      else if(!compare(password, dataCek.password)) throw {status: 400, message: 'Password Tidak Cocok'}
      dataCek.dataValues.password = undefined
      // attributes: {exclude: ['password']}, 

      dataCek = {...dataCek.dataValues, status_user: dataCek.status_user?'admin':'user'}  //tentukan admin / user
      const token = generateToken(dataCek) //buat token
      res.status(200).json({status: 200, message: 'success login', data: {...dataCek, token}})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async changePassword(req, res, next) {
    try {
      const {old_password, new_password} = req.body 
      if(!(old_password && new_password)) throw {status: 400, message: 'lengkapi data'}
      let result = await user.findOne({where:{email: req.dataUsers.email}})

      if(!result) throw {status: 402, message: 'email belum terdaftar'}
      if(!compare(old_password, result.password)) throw {status: 400, message: 'password tidak cocok'}

      result = await user.update({password: hashPassword(new_password)}, {where: {id: result.id}})
      if(!result) throw {status: 402, message: 'gagal mengubah password'}
      res.status(200).json({status: 200, message: 'success change password'})
    } catch (error) {
      next({status: 500, data: error})
    }
  }
  static async updateProfile(req, res, next) {
    try {
      const {username, email, contact, nik, birth_place, religion, gender, emergency_contact, emergency_name, status, name_company, name_university, major, degree, generation} = req.body
      const birth_date = req.body.birth_date ? new Date(req.body.birth_date) : undefined
      const image_profile = req.files.image_profile ? req.files.image_profile[0].filename : undefined
      const image_ktp = req.files.image_ktp ? req.files.image_ktp[0].filename : undefined
      if(email) var verify_email = false

      if(contact && /\D/.test(contact)) throw {status: 400, message: 'contact tidak valid'}
      if(emergency_contact && /\D/.test(emergency_contact)) throw {status: 400, message: 'emergency contact tidak valid'}
      if(nik && /\D/.test(nik)) throw {status: 400, message: 'nik tidak valid'}
      if(generation && /\D/.test(generation)) throw {status: 400, message: 'generation tidak valid'}
      if(email && !/\w+@\w+\.\w+/.test(email)) throw {status: 400, message: 'email tidak valid'}
      if(status && !/mahasiswa|kerja/.test(status)) throw {status: 400, message: 'status tidak valid'}
      if(birth_date && birth_date == 'Invalid Date') throw {status: 400, message: 'birth date tidak valid'}

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
      next({status: 500, data: error})
    }
  }
  static async updateUser(req, res, next) {
    try {
      if(!req.dataUsers.status_user) throw {status: 403, message: 'tidak memiliki akses'}
      const id = req.params.id
      let result = await user.findOne({where: {id}})
      console.log("=======req.dataUsers")
      console.log(result)
      if(!result)  throw {status: 402, message: 'user tidak ditemukan'}
      else if(result.status_user)  throw {status: 400, message: 'tidak bisa mengubah profile admin lain'}
      const {username, email, contact, nik, birth_place, religion, gender, emergency_contact, emergency_name, status, name_company, name_university, major, degree, generation} = req.body
      const birth_date = req.body.birth_date ? new Date(req.body.birth_date) : undefined
      const image_profile = req.files.image_profile ? req.files.image_profile[0].filename : undefined
      const image_ktp = req.files.image_ktp ? req.files.image_ktp[0].filename : undefined
      if(email) var verify_email = false

      if(contact && /\D/.test(contact)) throw {status: 400, message: 'contact tidak valid'}
      if(emergency_contact && /\D/.test(emergency_contact)) throw {status: 400, message: 'emergency contact tidak valid'}
      if(nik && /\D/.test(nik)) throw {status: 400, message: 'nik tidak valid'}
      if(generation && /\D/.test(generation)) throw {status: 400, message: 'generation tidak valid'}
      if(email && !/\w+@\w+\.\w+/.test(email)) throw {status: 400, message: 'email tidak valid'}
      if(status && !/mahasiswa|kerja/.test(status)) throw {status: 400, message: 'status tidak valid'}
      if(birth_date && birth_date == 'Invalid Date') throw {status: 400, message: 'birth date tidak valid'}

      //update
      result = await user.update(
        {username, email, verify_email, contact, nik, birth_place, birth_date, religion, gender, emergency_contact, emergency_name, status, name_company, name_university, major, degree, generation, image_profile, image_ktp}, 
        {where: {id}}
      )
      res.status(200).json({ status: 200, message: 'success update profile user'})
    } catch (error) {
      console.log(error)
      next({status: 500, data: error})
    }
  }
  // static async deleteAcount(req, res, next) {
  //   try {
  //     let {id, status_user} = req.dataUsers
  //     if(status_user){ 
  //       if(req.body.id && req.body.id != id) id = req.body.id
  //       else throw {status: 400, message: 'tidak bisa menghapus akun admin'}
  //     }

  //     let result = await user.destroy({where: {id}})
  //     if(result == 0) throw {status: 400, message: 'user tidak ditemukan'}

  //     res.status(200).json({ status: 200, message: 'berhasil dihapus'})
  //   } catch (error) {
  //     console.log(error)
  //     next({status: 500, data: error})
  //   }
  // }
}

module.exports = Controller