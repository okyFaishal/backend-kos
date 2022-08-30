const Controller = require( './controller' );
const router = require( 'express' ).Router();
const authentification = require( '../../middleware/authentification' );
const upload = require('../../middleware/upload');

// router.use(fileUpload());

router.post("/register", upload, Controller.register);
router.post("/register-admin", authentification, upload, Controller.registerAdmin);
router.post("/login", Controller.login);
router.put("/update-profile", authentification, upload, Controller.updateProfile);
router.put("/update-user/:id", authentification, upload, Controller.updateUser);
router.put("/change-password", authentification, Controller.changePassword);
router.get("/show-user", authentification, Controller.showUser);
router.get("/show-user-kos", authentification, Controller.showUserKos);
// router.delete("/delete-acount", authentification, Controller.deleteAcount);


module.exports = router