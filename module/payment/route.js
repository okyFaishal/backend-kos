const Controller = require( './controller' );
const router = require( 'express' ).Router();
const authentification = require( '../../middleware/authentification' );

router.get("/export-xlsx", Controller.exportXlsx)
router.get("/show-payment", Controller.showPayment)
router.get("/show-income", Controller.showIncome)
router.get("/show-count-payment", authentification, Controller.showCountPayment)
router.post("/create-payment-dp/", authentification, Controller.createPaymentDp)
router.post("/create-payment-angsuran/", authentification, Controller.createPaymentAngsuran)
router.put("/update-payment/:id", authentification, Controller.updatePayment)
router.delete("/delete-payment/:id", authentification, Controller.deletePayment)

module.exports = router