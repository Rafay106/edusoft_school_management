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

// 2. Class Routes
const classRouter = express.Router();

classRouter.route("/").get(AC.getClasses).post(AC.addClass);

classRouter
  .route("/:id")
  .get(AC.getClass)
  .patch(AC.updateClass)
  .delete(AC.deleteClass);

// 3. Section Routes
const sectionRouter = express.Router();

sectionRouter.route("/").get(AC.getSections).post(AC.addSection);

sectionRouter
  .route("/:id")
  .get(AC.getSection)
  .patch(AC.updateSection)
  .delete(AC.deleteSection);

// 4. Subject Routes
const subjectRouter = express.Router();

subjectRouter.route("/").get(AC.getSubjects).post(AC.addSubject);

subjectRouter
  .route("/:id")
  .get(AC.getSubject)
  .patch(AC.updateSubject)
  .delete(AC.deleteSubject);

academicRouter.use("/academic-year", academicYearRouter);
academicRouter.use("/class", classRouter);
academicRouter.use("/section", sectionRouter);
academicRouter.use("/subject", subjectRouter);

module.exports = academicRouter;
