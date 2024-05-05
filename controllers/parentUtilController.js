const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Student = require("../models/studentInfo/studentModel");
const Bus = require("../models/transport/busModel");

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

  res.status(200).json(students);
});

// @desc    Get buses
// @route   GET /api/pparent-util/bus-list
// @access  Private
const getBusList = asyncHandler(async (req, res) => {
  if (!C.isParent(req.user.type)) {
    res.status(403);
    throw new Error("Only parent account has access to this route.");
  }

  const manager = req.user.manager;
  const school = req.user.school;

  return res.json({ manager, school });

  const buses = await Bus.find({ manager, school }).select("name").lean();

  res.status(200).json(buses);
});

module.exports = {
  getChildrenOfParent,
  getBusList,
};
