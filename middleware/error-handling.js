module.exports = (result, req, res, next) => {
  if(result === true){ //success
    result = {status: 200, message: 'success'}
  }else if(typeof result == 'object'){ //error 
    if(!result.status) result.status = 500
    if(!result.message) result.message = 'error'
    
    if(result.data && typeof result.data == 'object'){
      let message = result.message
      let error = result.data
      //error sequelize / database
      // console.log(error)
      if(error.status && error.message && Number.isInteger(parseInt(error.status)) && parseInt(error.status) >= 0 && parseInt(error.status) <= 500){
        if(error.status) result.status = error.status
        if(error.message) result.message = error.message
        if(error.data) result.data = error.data
      }else if(error.name == 'SequelizeForeignKeyConstraintError') result.message = "id tidak ada"
      else if(error.name == 'SequelizeUniqueConstraintError') {
        if(error.errors){
          if(error.errors[0].message == 'email must be unique') result.message = 'email sudah digunakan'
          else if(error.errors[0].message == 'nik must be unique') result.message = 'nik sudah digunakan'
          else result.message = error.errors[0].message
        }
      }
      if(result.message != message) {result.data = undefined; result.status = 400}
    }
  }else{ //error sistem/server
    result = {status: 500, message: 'server error', data: result}
  }
  console.log(result)
  res.status(result.status).json(result)
}