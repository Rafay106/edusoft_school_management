const express = require("express");
const CC = require("../controllers/commsController");

const router = express.Router();

const noticeRouter = express.Router();

noticeRouter.route("/").get(CC.getNotices).post(CC.addNotice);

noticeRouter
  .route("/:id")
  .get(CC.getNotice)
  .patch(CC.updateNotice)
  .delete(CC.deleteNotice);

router.use("/notice-board", noticeRouter);

module.exports = router;
