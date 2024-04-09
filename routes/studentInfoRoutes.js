const express = require("express");
const C = require("../controllers/studentInfoController");
const {
  studentPhotoUpload,
  studentBulkImportUpload,
} = require("../middlewares/multerMiddleware");

const router = express.Router();

// 1. StudentType Routes
const studentTypeRouter = express.Router();

studentTypeRouter.route("/").get(C.getStudentTypes).post(C.addStudentType);
studentTypeRouter
  .route("/:id")
  .get(C.getStudentType)
  .patch(C.updateStudentType)
  .delete(C.deleteStudentType);

// 2. Student Routes
const studentRouter = express.Router();

studentRouter
  .route("/")
  .get(C.getStudents)
  .post(studentPhotoUpload.single("photo"), C.addStudent);

studentRouter
  .route("/:id")
  .get(C.getStudent)
  .patch(studentPhotoUpload.single("photo"), C.updateStudent)
  .delete(C.deleteStudent);

studentRouter.post(
  "/bulk",
  studentBulkImportUpload.single("import"),
  C.bulkOpsStudent
);

// 3. Student Bus Attendance Routes
const stuBusAttRouter = express.Router();

stuBusAttRouter.post("/", C.getStudentAttendance);

// 4. Student Attendance Notification Routes
const stuAttNotiRouter = express.Router();

stuAttNotiRouter.post("/", C.getStuAttNotification);

router.use("/student-type", studentTypeRouter);
router.use("/student", studentRouter);
router.use("/attendance", stuBusAttRouter);
router.use("/attendance-notification", C.getStuAttNotification);

module.exports = router;
