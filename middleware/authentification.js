const {verifyToken} = require('../helper/jwt')
const user = require('../module/user/model')

async function authentification(req, res, next){
  try {
    const {token} = req.headers
    if(token){
      req.dataToken = verifyToken(token)
      req.dataUsers = await user.findOne({where: {id: req.dataToken.id}})
      if(!req.dataUsers) throw ''
      next()
    }else{
      res.status(200).json({ status: 200, message: "anda belum login" });
    }
  } catch(err) {
    console.log(err)
    res.status(200).json({ status: 200, message: "anda belum login" });
  }
}

module.exports = authentification
