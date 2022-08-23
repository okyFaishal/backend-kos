const Controller = require( './controller' );
const router = require( 'express' ).Router();
const authentification = require( '../../middleware/authentification' );
const upload = require('../../middleware/upload');

// router.use(fileUpload());

router.post("/register", upload, Controller.register);
router.post("/login", Controller.login);
router.put("/update-profile", authentification, upload, Controller.updateProfile);
// router.delete("/delete-acount", authentification, Controller.deleteAcount);


module.exports = router