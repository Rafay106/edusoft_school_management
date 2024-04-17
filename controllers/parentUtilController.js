const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Student = require("../models/studentInfo/studentModel");

// @desc    Get children of a parent
// @route   GET /api/parent-util/children
// @access  Private
const getChildrenOfParent = asyncHandler(async (req, res) => {
  if (!C.isParent(req.user.type)) {
    res.status(403);
    throw new Error("Only parent account has access to this route.");
  }

  const students = await Student.find({ parent: req.user._id })
    .select("admission_no name")
    .lean();

  for (const s of students) {
    s.name = UC.getPersonName(s.name);
  }

  res.status(200).json(students);
});

module.exports = {
  getChildrenOfParent,
};
