const Controller = require( './controller' );
const router = require( 'express' ).Router();
const authentification = require( '../../middleware/authentification' );

router.get("/show-package", authentification, Controller.showPackage);
router.post("/create-package", authentification, Controller.createPackage);
router.put("/update-package/:id", authentification, Controller.updatePackage);
router.delete("/delete-package/:id", authentification, Controller.deletePackage);

module.exports = router