const express = require("express");
const LC = require("../controllers/lessonController");
const {lessonplanFileUpload} = require("../middlewares/multerMiddleware");

const lessonPlanRouter = express.Router();
// 1 lesson
const lessonRouter = express.Router();
lessonRouter.route("/").post(LC.addLesson).get(LC.getLessons);
lessonRouter
  .route("/:id")
  .get(LC.getLesson)
  .patch(LC.updateLesson)
  .delete(LC.deleteLesson);

// 2 Topic.

const topicRouter = express.Router();
topicRouter.route("/")
   .post(LC.addTopic).get(LC.getTopics);
topicRouter
     .route("/:id")
     .get(LC.getTopic)
     .patch(LC.updateTopic)
     .delete(LC.deleteTopic);

// 3 topicOverview

const topicOverviewRouter = express.Router();
topicOverviewRouter
      .route("/")
      .get(LC.getTopicOverview);

// 4 lessonplan
const lesson_planRouter = express.Router();

lesson_planRouter
       .route("/")
       .post(LC.addLessonPlan);



lessonPlanRouter.use("/", lessonRouter);
lessonPlanRouter.use("/topic", topicRouter);
lessonPlanRouter.use("/topicOverview",topicOverviewRouter);
lessonPlanRouter.use("/lesson_plan",lesson_planRouter);
module.exports = lessonPlanRouter;
