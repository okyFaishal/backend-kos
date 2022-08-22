const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs')
const router = require( 'express' ).Router();

const storage = multer.diskStorage({
  //letak file
  destination: function (req, file, cb) {
    // console.log("==========================================")
    let name = file.fieldname.split('_') 
    cb(null, `asset/${name[0]}/${name[1]}`)
  },
  //format penulisan file
  filename: function (req, file, next) {
    next(null, new Date().getTime() + '-' +file.originalname)
  }
})

const fileFilter = async (req, file, cb) => {
  try {
    if(!(file && file.fieldname.includes('image') && /jpeg|jpg|png/.test(file.mimetype))) cb(null, false)
    else cb(null, true)
  } catch (error) {
    console.log(error)
    res.status(200).json({ status: 200, message: 'error', data: error })
  }
};

const Multer = multer({ storage, fileFilter }).fields([
  {name: 'image_profile', maxCount: 1}, 
  {name: 'image_ktp', maxCount: 1}, 
  {name: 'file'}
])


router.use("/", Multer, async (req, res, next)=>{
  try {
    for (const key in req.files) {
      const el = req.files[key]
      for (let i = 0; i < el.length; i++) {
        const ell = el[i];
        //image
        if(ell && /jpeg|jpg|png/.test(ell.mimetype)){
          const path = `${ell.destination}/${ell.filename}`
          const newFileName = `${new Date().getTime()}-${ell.originalname}`
          const newPath = `${ell.destination}/${newFileName}`
          let name = ell.fieldname.split('_')
          let result = {}
          if(name[1] == 'profile'){ ///image profile
            result = await sharp(path).resize(200, 200).toFile(newPath) //create convert image 
          }else{
            result = await sharp(path).resize(1000, 1000, { fit: sharp.fit.inside, withoutEnlargement: true}).toFile(newPath) //create convert image 
          }
          fs.unlinkSync(path) //delete image original
          req.files[key][i] = {...ell, ...result, ...{path: newPath, filename: newFileName}}
        }
      }
    }
    next()
  } catch (error) {
    console.log(error)
    res.status(200).json({ status: 200, message: 'error', data: error })
  }
});

module.exports = router