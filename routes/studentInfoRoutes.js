const express = require("express");
const C = require("../controllers/studentInfoController");
const { photoUpload, uploadExcel } = require("../middlewares/multerMiddleware");
const uploadPaths = require("../config/uploadPaths");

const router = express.Router();

// 1. BoardingType Routes
const boardingTypeRouter = express.Router();

boardingTypeRouter
  .route("/")
  .get(C.getBoardingTypes)
  .post(C.addBoardingType)
  .delete(C.deleteBoardingType);
boardingTypeRouter
  .route("/:id")
  .get(C.getBoardingType)
  .patch(C.updateBoardingType);

// 2. SubWard Routes
const subwardRouter = express.Router();

subwardRouter
  .route("/")
  .get(C.getSubWards)
  .post(C.addSubWard)
  .delete(C.deleteSubWard);
subwardRouter.route("/:id").get(C.getSubWard).patch(C.updateSubWard);

// 3. Student Routes
const studentRouter = express.Router();

studentRouter
  .route("/")
  .get(C.getStudents)
  .post(photoUpload(uploadPaths.student).single("photo"), C.addStudent);
studentRouter.post(
  "/bulk",
  uploadExcel(uploadPaths.bulk_import).single("file"),
  C.bulkOpsStudent
);
studentRouter
  .route("/:id")
  .get(C.getStudent)
  .patch(photoUpload(uploadPaths.student).single("photo"), C.updateStudent)
  .delete(C.deleteStudent);

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
