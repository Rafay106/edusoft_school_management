const express = require("express");
const CC = require("../controllers/commsController");
const { upload } = require("../middlewares/multerMiddleware");
const path = require("node:path");

const router = express.Router();

const noticeRouter = express.Router();
const noticeFilePath = path.join("static", "uploads", "notice");

noticeRouter
  .route("/")
  .get(CC.getNotices)
  .post(upload(noticeFilePath).single("file"), CC.addNotice);

noticeRouter
  .route("/:id")
  .get(CC.getNotice)
  .patch(CC.updateNotice)
  .delete(CC.deleteNotice);

router.use("/notice-board", noticeRouter);
router.post("/send-msg", upload(noticeFilePath).single("file"), CC.sendMessage);

module.exports = router;
