const express = require("express");
const HWC = require("../controllers/homeworkController");
const {
  homeworkUpload,
  homeworkEvaluationUpload,
} = require("../middlewares/multerMiddleware");

const homeworkRouter = express.Router();

homeworkRouter
  .route("/")
  .post(homeworkUpload.single("file"), HWC.addHomework)
  .get(HWC.getHomeworkList);
homeworkRouter
  .route("/:id")
  .patch(HWC.updateHomework)
  .delete(HWC.deleteHomework);
homeworkRouter
  .route("/evaluation")
  .post(homeworkEvaluationUpload.single("file"), HWC.addEvaluataion).get(HWC.homeworkReportList);
homeworkRouter
  .route("/evaluation/:id")
  .patch(HWC.updateEvaluation)
  .delete(HWC.deleteEvaluation);

homeworkRouter.route("/report").post(HWC.homeworkReportList);

// homeworkRouter.get("/report", HWC.getHomeworkReport);

module.exports = homeworkRouter;
