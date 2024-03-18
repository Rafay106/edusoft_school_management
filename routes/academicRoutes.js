const express = require("express");
const {
  studentPhotoUpload,
  studentBulkImportUpload,
} = require("../middlewares/multerMiddleware");
const AC = require("../controllers/academicController");

const academicRouter = express.Router();

// 1. Academic Year Routes
const academicYearRouter = express.Router();

academicYearRouter.route("/").get(AC.getAcademicYears).post(AC.addAcademicYear);

academicYearRouter
  .route("/:id")
  .get(AC.getAcademicYear)
  .patch(AC.updateAcademicYear)
  .delete(AC.deleteAcademicYear);

// 1. Class Routes
const classRouter = express.Router();

classRouter.route("/").get(AC.getClasses).post(AC.addClass);

classRouter
  .route("/:id")
  .get(AC.getClass)
  .patch(AC.updateClass)
  .delete(AC.deleteClass);

// 2. Section Routes
const sectionRouter = express.Router();

sectionRouter.route("/").get(AC.getSections).post(AC.addSection);

sectionRouter
  .route("/:id")
  .get(AC.getSection)
  .patch(AC.updateSection)
  .delete(AC.deleteSection);

// 3. Student Routes
const studentRouter = express.Router();

studentRouter
  .route("/")
  .get(AC.getStudents)
  .post(studentPhotoUpload.single("photo"), AC.addStudent);

studentRouter
  .route("/:id")
  .get(AC.getStudent)
  .patch(AC.updateStudent)
  .delete(AC.deleteStudent);

studentRouter.post(
  "/bulk",
  studentBulkImportUpload.single("import"),
  AC.bulkOpsStudent
);

studentRouter
  .route("/pik-loc/:id")
  .post(AC.addPickupLocation)
  .delete(AC.removePickupLocation);

academicRouter.use("/academic-year", academicYearRouter);
academicRouter.use("/class", classRouter);
academicRouter.use("/section", sectionRouter);
academicRouter.use("/student", studentRouter);

module.exports = academicRouter;
