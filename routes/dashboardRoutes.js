const express = require("express");
const C = require("../controllers/dashboardController");

const router = express.Router();

router.post("/school", C.schoolDashboard);

module.exports = router;
