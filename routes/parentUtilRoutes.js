const router = require("express").Router();
const Util = require("../controllers/parentUtilController");

router.get("/children", Util.getChildrenOfParent);

module.exports = router;
