const express = require("express");
const EC = require("../controllers/examinationController");

const examinationRouter = express.Router();
// 1 examType router
const examTypeRouter = express.Router();

examTypeRouter.route("/").post(EC.addExamType).get(EC.getExamTypes);

examTypeRouter
  .route("/:id")
  .get(EC.getExamType)
  .patch(EC.updateExamType)
  .delete(EC.deleteExamtype);

// 2 examSchedule router
const examScheduleRouter = express.Router();
examScheduleRouter.route("/").post(EC.addExamSchedule).get(EC.getExamSchedules);
examScheduleRouter
  .route("/:id")
  .get(EC.getExamSchedule)
  .patch(EC.updateExamShedule)
  .delete(EC.deleteExamSchedule);

// 3 examClassSubject router
const examClassSubjectRouter = express.Router();
examClassSubjectRouter
  .route("/")
  .post(EC.addExamClassSubject)
  .get(EC.getExamClassSubjects);

examClassSubjectRouter
  .route("/:id")
  .get(EC.getExamClassSubject)
  .patch(EC.updateExamClassSubject)
  .delete(EC.deleteExamClassSubject);

// 4 examSubjectMarks router
const examSubjectMarksRouter = express.Router();
examSubjectMarksRouter
  .route("/")
  .post(EC.addExamSubjectMarks)
  .get(EC.getExamSubjectsMarks);

examinationRouter.use("/type", examTypeRouter);
examinationRouter.use("/schedule", examScheduleRouter);
examinationRouter.use("/class-subject", examClassSubjectRouter);
examinationRouter.use("/subject-marks", examSubjectMarksRouter);

module.exports = examinationRouter;
