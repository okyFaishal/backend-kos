const {verifyToken} = require('../helper/jwt')
const user = require('../module/user/model')

async function authentification(req, res, next){
  try {
    const {token} = req.headers
    if(token){
      req.dataToken = verifyToken(token)
      req.dataUsers = await user.findOne({where: {email: req.dataToken.email}})
      if(!req.dataUsers) throw ''
      req.dataUsers = req.dataUsers.dataValues
      next()
    }else{
      res.status(403).json({ status: 403, message: "anda belum login" });
    }
  } catch(err) {
    console.log(err)
    res.status(403).json({ status: 403, message: "anda belum login" });
  }
}

module.exports = authentification
