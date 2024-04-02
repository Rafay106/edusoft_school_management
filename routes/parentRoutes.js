const express = require("express");
const router = express.Router();
const C = require("../controllers/parentController");

router.get("/account-info", C.getParentAccountInfo);
router.post("/add-student", C.addStudent);
router.post("/bus/track", C.trackBus);
router.post("/student/attendance", C.getStudentAttendance);
router.post("/student/attendance-notification", C.getStuAttNotification);

module.exports = router;
