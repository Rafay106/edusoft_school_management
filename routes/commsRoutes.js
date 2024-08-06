const express = require("express");
const CC = require("../controllers/commsController");
const { upload, uploadExcel } = require("../middlewares/multerMiddleware");
const uploadPaths = require("../config/uploadPaths");

const router = express.Router();

const noticeRouter = express.Router();

noticeRouter
  .route("/")
  .get(CC.getNotices)
  .post(upload(uploadPaths.notice).single("file"), CC.addNotice);
noticeRouter.post(
  "/bulk",
  uploadExcel(uploadPaths.bulk_import).single("file"),
  CC.bulkOpsNotice
);
noticeRouter
  .route("/:id")
  .get(CC.getNotice)
  .patch(CC.updateNotice)
  .delete(CC.deleteNotice);

router.use("/notice-board", noticeRouter);
router.post(
  "/send-msg",
  upload(uploadPaths.notice).single("file"),
  CC.sendMessage
);

module.exports = router;
