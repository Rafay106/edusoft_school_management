const express = require("express");
const C = require("../controllers/studentInfoController");
const {
  studentPhotoUpload,
  studentBulkImportUpload,
} = require("../middlewares/multerMiddleware");

const router = express.Router();

// 1. BoardingType Routes
const boardingTypeRouter = express.Router();

boardingTypeRouter.route("/").get(C.getBoardingTypes).post(C.addBoardingType);
boardingTypeRouter
  .route("/:id")
  .get(C.getBoardingType)
  .patch(C.updateBoardingType)
  .delete(C.deleteBoardingType);

// 2. SubWard Routes
const subwardRouter = express.Router();

subwardRouter.route("/").get(C.getSubWards).post(C.addSubWard);
subwardRouter
  .route("/:id")
  .get(C.getSubWard)
  .patch(C.updateSubWard)
  .delete(C.deleteSubWard);

// 3. Student Routes
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

router.use("/boarding-type", boardingTypeRouter);
router.use("/sub-ward", subwardRouter);
router.use("/student", studentRouter);
router.use("/attendance", stuBusAttRouter);
router.use("/attendance-notification", C.getStuAttNotification);

module.exports = router;
