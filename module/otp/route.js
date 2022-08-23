const Controller = require( './controller' )
const router = require( 'express' ).Router()
const authentification = require( '../../middleware/authentification' );

router.post("/create-otp", Controller.createOtp);
router.post("/check-otp", Controller.checkOtp);

// router.post("/register", authentification, Controller.register);
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