const Controller = require( './controller' );
const router = require( 'express' ).Router();
const authentification = require( '../../middleware/authentification' );

router.get("/show-history", authentification, Controller.showHistory)
// router.post("/create-history/:build_id", authentification, Controller.createHistory)
router.put("/update-history/:id", authentification, Controller.updateHistory)
router.delete("/delete-history/:id", authentification, Controller.deleteHistory)

module.exports = router