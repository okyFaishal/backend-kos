const Controller = require( './controller' );
const router = require( 'express' ).Router();
const authentification = require( '../../middleware/authentification' );

router.get("/show-room", authentification, Controller.showRoom)
router.post("/create-room/:build_id", authentification, Controller.createRoom)
router.put("/update-room/:id", authentification, Controller.updateRoom)
router.delete("/delete-room/:id", authentification, Controller.deleteRoom)

module.exports = router