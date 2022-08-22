const bcrypt = require('bcryptjs')

function hashPassword(password){
  const salt = bcrypt.genSaltSync(10)
  return bcrypt.hashSync(password, salt)
}

function compare(password, hash){
  return bcrypt.compareSync(password, hash)
}

module.exports = {
  hashPassword, compare
}