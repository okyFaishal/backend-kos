const Controller = require( './controller' );
const router = require( 'express' ).Router();
const authentification = require( '../../middleware/authentification' );

router.get("/show-build", authentification, Controller.showBuild);
router.post("/create-build", authentification, Controller.createBuild);
router.put("/update-build/:id", authentification, Controller.updateBuild);
router.delete("/delete-build/:id", authentification, Controller.deleteBuild);

module.exports = router