const express = require("express");
const router = express.Router();
const HWC = require("../controllers/tutionController");
const { upload } = require("../middlewares/multerMiddleware");
const uploadPaths = require("../config/uploadPaths");

const tutionRouter = express.Router();

// 1 Homework Routes
const homeworkRouter = express.Router();
homeworkRouter
  .route("/")
  .get(HWC.getHomeworks)
  .post(upload(uploadPaths.homework).single("file"), HWC.addHomework);
homeworkRouter
  .route("/:id")
  .patch(HWC.updateHomework)
  .delete(HWC.deleteHomework);

// 2 homework evaluation

homeworkRouter
  .route("/evaluation")
  .post(
    upload(uploadPaths.homework_evaluation).single("file"),
    HWC.addEvaluataion
  );
homeworkRouter.route("/report").get(HWC.getHomeworkReportList);

// 3 homework evaluation report
homeworkRouter
  .route("/evaluation/:id")
  .patch(HWC.updateEvaluation)
  .delete(HWC.deleteEvaluation);

// 4 study material
const studyMaterialRouter = express.Router();
studyMaterialRouter
  .route("/")
  .post(
    upload(uploadPaths.study_material).single("document"),
    HWC.addStudyMaterial
  )
  .get(HWC.getStudyMaterials);

studyMaterialRouter
  .route("/:id")
  .get(HWC.getStudyMaterial)
  .patch(HWC.updateStudyMaterial)
  .delete(HWC.deleteStudyMaterial);

tutionRouter.use("/homework", homeworkRouter);
tutionRouter.use("/study-material", studyMaterialRouter);

module.exports = tutionRouter;
