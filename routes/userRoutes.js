const express = require("express");
const UC = require("../controllers/userController");

const router = express.Router();

router.get("/", UC.getSelf);

module.exports = router;
