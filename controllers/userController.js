const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const User = require("../models/system/userModel");
const Student = require("../models/studentInfo/studentModel");

// @desc    Get self
// @route   GET /api/user
// @access  Private
const getSelf = asyncHandler(async (req, res) => {
  const result = req.user;

  if (C.isParent(req.user.type)) {
    const students = await Student.find({ parent: req.user._id }).lean();

    for (const student of students) {
      student.photo = `${process.env.DOMAIN}/uploads/student/${student.photo}`;
    }
    result.students = students;
  }

  res.status(200).json(result);
});

module.exports = {
  getSelf,
};
