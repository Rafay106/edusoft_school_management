const router = require("express").Router();
const DSC = require("../controllers/deviceServiceController");

router.post("/", DSC.postService);

module.exports = router;
