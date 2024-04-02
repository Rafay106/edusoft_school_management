const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const Student = require("../models/studentInfo/studentModel");
const User = require("../models/system/userModel");

router.post(
  "/1",
  asyncHandler(async (req, res) => {
    const user = await User.create(req.body);

    res.json(user);
  })
);

module.exports = router;
