const Controller = require( './controller' );
const router = require( 'express' ).Router();
const authentification = require( '../../middleware/authentification' );

router.get("/show-history", authentification, Controller.showHistory)
router.get("/show-history-by-user", authentification, Controller.showHistoryByUser)
router.get("/show-history-clear-room", authentification, Controller.showHistoryClearRoom)
router.get("/show-history-now", authentification, Controller.showHistoryNow)
// router.post("/create-history/:build_id", authentification, Controller.createHistory)
router.put("/update-history/:id", authentification, Controller.updateHistory)
router.delete("/delete-history/:id", authentification, Controller.deleteHistory)
router.delete("/clear-room-by-room/:id", authentification, Controller.clearRoomByRoom)
router.delete("/clear-room-by-history/:id", authentification, Controller.clearRoomByHistory)

module.exports = router