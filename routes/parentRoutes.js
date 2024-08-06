const express = require("express");
const router = express.Router();
const { upload } = require("../middlewares/multerMiddleware");
const uploadPaths = require("../config/uploadPaths");
const C = require("../controllers/parentController");

router.get("/account-info", C.getParentAccountInfo);
router.post("/add-student", C.addStudent);
router.post("/bus/track", C.trackBus);
router.post("/fee/calculate", C.feeCalculate);
router.post("/fee/pay", C.feePayment);
router.post("/attendance/bus", C.getStudentBusAttendance);
router.post("/attendance/class", C.getStudentClassAttendance);
router.post("/student/attendance-count", C.getStudentAttendanceCount);
router.post(
  "/student/attendance-notification",
  C.getStudentAttendanceNotification
);
router.post("/student/bus-contact-info", C.getStudentBusContactInfo);
router.post("/student/attendance-calendar", C.getStudentAttendanceCalendar);

router.get("/notice", C.getSchoolNotices);
router.get("/notice/:id", C.getSchoolNotice);

router
  .route("/homework/submission")
  .post(
    upload(uploadPaths.homework_submission).single("file"),
    C.addHomeworkSubmission
  )
  .get(C.getHomeworkSubmissions);
router
  .route("/homework/submission/:id")
  .get(C.getHomeWorkSubmission)
  .patch(C.updateHomeworkSubmission)
  .delete(C.deleteHomeworkSubmission);

module.exports = router;
