const express = require("express");
const AC = require("../controllers/academicController");

const academicRouter = express.Router();

// 1. Academic Year Routes
const academicYearRouter = express.Router();

academicYearRouter.route("/").get(AC.getAcademicYears).post(AC.addAcademicYear);
academicYearRouter.post("/set-current", AC.setCurrentAcademicYear);
academicYearRouter
  .route("/:id")
  .get(AC.getAcademicYear)
  .patch(AC.updateAcademicYear)
  .delete(AC.deleteAcademicYear);

// 2. Section Routes
const sectionRouter = express.Router();

sectionRouter.route("/").get(AC.getSections).post(AC.addSection);

sectionRouter
  .route("/:id")
  .get(AC.getSection)
  .patch(AC.updateSection)
  .delete(AC.deleteSection);

// 3. Stream Routes
const streamRouter = express.Router();

streamRouter.route("/").get(AC.getStreams).post(AC.addStream);

streamRouter
  .route("/:id")
  .get(AC.getStream)
  .patch(AC.updateStream)
  .delete(AC.deleteStream);

// 4. Class Routes
const classRouter = express.Router();

classRouter.route("/").get(AC.getClasses).post(AC.addClass);

classRouter
  .route("/:id")
  .get(AC.getClass)
  .patch(AC.updateClass)
  .delete(AC.deleteClass);

// 5. Subject Routes
const subjectRouter = express.Router();

subjectRouter.route("/").get(AC.getSubjects).post(AC.addSubject);

subjectRouter
  .route("/:id")
  .get(AC.getSubject)
  .patch(AC.updateSubject)
  .delete(AC.deleteSubject);

// 6 class_Routine routes
const classroutineRouter = express.Router();
classroutineRouter.route("/").post(AC.addClassRoutine).get(AC.getClassRoutine);
classroutineRouter.route("/:id").delete(AC.deleteClassRoutine);


academicRouter.use("/academic-year", academicYearRouter);
academicRouter.use("/section", sectionRouter);
academicRouter.use("/stream", streamRouter);
academicRouter.use("/class", classRouter);
academicRouter.use("/subject", subjectRouter);
academicRouter.use("/class-routine", classroutineRouter);

module.exports = academicRouter;
