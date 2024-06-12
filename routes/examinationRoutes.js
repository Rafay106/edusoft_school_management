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
  examClassSubjectRouter.route("/")
                


  examinationRouter.use("/type", examTypeRouter);
examinationRouter.use("/schedule", examScheduleRouter);
examinationRouter.use("/class-subject",examClassSubjectRouter);


module.exports = examinationRouter;
