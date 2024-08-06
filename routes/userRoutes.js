const express = require("express");
const UC = require("../controllers/userController");

const router = express.Router();

router.get("/", UC.getSelf);

const notificationRouter = express.Router();

notificationRouter.post("/push", UC.getPushNotification);

router.use("/notification", notificationRouter);

module.exports = router;
