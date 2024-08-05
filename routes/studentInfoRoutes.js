const express = require("express");
const C = require("../controllers/studentInfoController");
const { photoUpload, uploadExcel } = require("../middlewares/multerMiddleware");
const uploadPaths = require("../config/uploadPaths");

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
  .post(photoUpload(uploadPaths.student).single("photo"), C.addStudent);
studentRouter.post(
  "/upload-photo",
  photoUpload(uploadPaths.student).single("photo"),
  (req, res) =>
    res.json({
      file: req.file,
      url: `${process.env.DOMAIN}/uploads/student/${
        req.file?.filename || Date.now()
      }`,
    })
);
studentRouter.post(
  "/bulk",
  uploadExcel(uploadPaths.bulk_import).single("file"),
  C.bulkOpsStudent
);
studentRouter.route("/:id").get(C.getStudent).delete(C.deleteStudent);

// 3. Student attendance Routes
const attendanceRouter = express.Router();

// attendanceRouter.post("/bus", C.getBusAttendance_old);
attendanceRouter.post("/bus", C.getBusAttendanceWithAbsent);
attendanceRouter.post("/bus-stats", C.getBusAttendanceStats);
// attendanceRouter.post("/class", C.getClassAttendance_old);
attendanceRouter.post("/class", C.getClassAttendanceWithAbsent);
attendanceRouter.post("/class-stats", C.getClassAttendanceStats);
attendanceRouter.post("/today", C.getStudentAttendanceToday);

// 4. Student Notification Routes
const studentNotificationRouter = express.Router();

studentNotificationRouter.post("/", C.getStudentNotification);

router.use("/boarding-type", boardingTypeRouter);
router.use("/sub-ward", subwardRouter);
router.use("/student", studentRouter);
router.use("/attendance", attendanceRouter);
router.use("/student-notification", studentNotificationRouter);

module.exports = router;
