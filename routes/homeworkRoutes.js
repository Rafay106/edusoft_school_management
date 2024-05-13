const express = require("express");
const HWC = require("../controllers/homeworkController");

const homeworkRouter = express.Router();

homeworkRouter.route("/").post(HWC.addHomework).get(HWC.getHomeworkList);
homeworkRouter.route("/:id").patch(HWC.updateHomework).delete(HWC.deleteHomework);
homeworkRouter.route("/evaluation").post(HWC.addEvaluataion);
homeworkRouter.route("/evaluation/:id").patch(HWC.updateEvaluation).delete(HWC.deleteEvaluation);
homeworkRouter.route("/evaluationReport").get(HWC.getHomeworkReport);

// homeworkRouter.get("/report", HWC.getHomeworkReport);

module.exports = homeworkRouter;
