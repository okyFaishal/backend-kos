var multer  = require('multer')


const storage = multer.diskStorage({
    destination:'./asset/kelengkapan/',
    filename:function(req,file,cb){
        cb(null,Date.now()+file.originalname)
        //  console.log(file)
    }
})

const upload=multer({
    storage:storage
}).fields([{ name: 'file1'},{ name: 'file2'},{ name: 'file3'},{ name: 'file4'}])

module.exports = upload