const router = require("express").Router();
const Util = require("../controllers/utilController");

router.get("/manager-list", Util.getManagerList);
router.get("/school-list", Util.getSchoolList);
router.get("/driver-list", Util.getDriverList);
router.get("/conductor-list", Util.getConductorList);
router.get("/bus-stop-list", Util.getBusStopList);
router.get("/bus-list", Util.getBusList);
router.get("/class-list", Util.getClassList);
router.get("/section-list", Util.getSectionList);

module.exports = router;
