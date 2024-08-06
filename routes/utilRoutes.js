const router = require("express").Router();
const Util = require("../controllers/utilController");

router.get("/role-list", Util.getRoleList);
router.get("/usertype-list-with-count", Util.getUsertypeListWithCount);
router.get("/user-list", Util.getUserList);
router.get("/parent-employee-list", Util.getParentAndEmployeeList);
router.get("/boarding-type-list", Util.getBoardingTypeList);
router.get("/subward-list", Util.getSubwardList);
router.get("/driver-list", Util.getDriverList);
router.get("/conductor-list", Util.getConductorList);
router.get("/bus-stop-list", Util.getBusStopList);
router.get("/bus-list", Util.getBusList);
router.get("/academic-year-list", Util.getAcademicYearList);
router.get("/section-list", Util.getSectionList);
router.get("/section-list-of-class", Util.getSectionListOfClass);
router.get("/stream-list", Util.getStreamList);
router.get("/class-list", Util.getClassList);
router.get("/class-with-section-list", Util.getClassWithSectionList);
router.get("/subject-list", Util.getSubjectList);
router.get("/fee-group-list", Util.getFeeGroupList);
router.get("/fee-type-list", Util.getFeeTypeList);
router.get("/fee-term-list", Util.getFeeTermList);
router.get("/designation-list", Util.getDesignationList);
router.get("/department-list", Util.getDepartmentList);
router.get("/library-category-list", Util.getLibraryCategoryList);
router.get("/library-subject-list", Util.getLibrarySubjectList);
router.get("/bank-list", Util.getBankList);
router.get("/chart-list", Util.getChartList);

router.post("/excel-from-json", Util.getExcelFromJson);

module.exports = router;
