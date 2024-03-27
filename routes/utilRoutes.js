const router = require("express").Router();
const Util = require("../controllers/utilController");

router.get("/manager-list", Util.getManagerList);
router.get("/school-list", Util.getSchoolList);
router.get("/student-type-list", Util.getStudentTypeList);
router.get("/driver-list", Util.getDriverList);
router.get("/conductor-list", Util.getConductorList);
router.get("/bus-stop-list", Util.getBusStopList);
router.get("/bus-list", Util.getBusList);
router.get("/academic-year-list", Util.getAcademicYearList);
router.get("/section-list", Util.getSectionList);
router.get("/class-list", Util.getClassList);
router.get("/fee-group-list", Util.getFeeGroupList);
router.get("/fee-type-list", Util.getFeeTypeList);
router.get("/fee-term-list", Util.getFeeTermList);
router.get("/fee-head-list", Util.getFeeHeadList);
router.get("/designation-list", Util.getDesignationList);
router.get("/department-list", Util.getDepartmentList);

module.exports = router;
