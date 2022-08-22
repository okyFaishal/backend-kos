const Controller = require( './controller' );
const router = require( 'express' ).Router();
const authentification = require( '../../middleware/authentification' );
const upload = require('../../middleware/upload');

// router.use(fileUpload());

router.post("/register", upload, Controller.register);
router.post("/login", Controller.login);
router.put("/update-profile", authentification, upload, Controller.updateProfile);
router.delete("/delete-acount", authentification, Controller.deleteAcount);
// router.post("/insert", authentification, Controller.insert);
// router.get("/list", authentification, Controller.list);
// router.post("/listAbsenByBulan", authentification, Controller.listAbsenByBulan);
// router.get("/listAbsenByDivisi/:masterDivisiId", authentification, Controller.listAbsenByDivisi);
// router.get("/listAbsenByPosisi/:masterPosisiId", authentification, Controller.listAbsenByPosisi);
// router.get("/listAbsenByKaryawanId/:datakaryawanId", authentification, Controller.listAbsenByKaryawanId);
// router.post("/detailAbsenKaryawanByBulan", authentification, Controller.detailAbsenKaryawanByBulan);
// router.post("/update", authentification, Controller.update);
// router.post("/delete", authentification, Controller.delete);
// router.post("/listDetailsAbsenByDataKaryawanId", authentification, Controller.listDetailsAbsenByDataKaryawanId);


module.exports = router