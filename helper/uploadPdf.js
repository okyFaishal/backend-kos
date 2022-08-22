var multer  = require('multer')
// var mime = require('mime-types')

const storage = multer.diskStorage({
    destination:'./asset/pdf/',
    filename:function(req,file,cb){
        cb(null,Date.now()+file.originalname)
        //  console.log(file, "ini file")
    }
})

const upload=multer({
    storage:storage
}).fields([{ name: 'file1'},{ name: 'file2'},{ name: 'file3'}])

module.exports = upload