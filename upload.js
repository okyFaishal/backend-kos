const multer = require('multer')

const storage = multer.diskStorage({
    //letak file
    destination: function (req, file, next) {
      next(null, 'public/-')
    },
    //format penulisan file
    filename: function (req, file, next) {
      next(null, new Date().getTime() + '-' +file.originalname)
    }
})
const Multer = multer({ storage: storage }).fields([
    {name: 'profileGroup', maxCount: 1}, 
    {name: 'profile', maxCount: 1}, 
    {name: 'file'}
])
module.exports = Multer