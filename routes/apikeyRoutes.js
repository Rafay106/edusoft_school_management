const express = require("express");
const AC = require("../controllers/apikeyController");

const router = express.Router();

router.get("/notice-board", AC.getNotices);

module.exports = router;
