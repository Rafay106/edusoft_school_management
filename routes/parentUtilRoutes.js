const router = require("express").Router();
const Util = require("../controllers/parentUtilController");

router.get("/children", Util.getChildrenOfParent);
router.get("/bus-list", Util.getBusList);

module.exports = router;
