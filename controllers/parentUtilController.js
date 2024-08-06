const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Student = require("../models/studentInfo/studentModel");
const Bus = require("../models/transport/busModel");

// @desc    Get children of a parent
// @route   GET /api/parent-util/children
// @access  Private
const getChildrenOfParent = asyncHandler(async (req, res) => {
  const students = await Student.find({ parent: req.user._id })
    .select("admission_no name")
    .lean();

  res.status(200).json(students);
});

// @desc    Get buses
// @route   GET /api/pparent-util/bus-list
// @access  Private
const getBusList = asyncHandler(async (req, res) => {
  const buses = await Bus.find({ school: req.school._id })
    .select("name")
    .lean();

  res.status(200).json(buses);
});

module.exports = {
  getChildrenOfParent,
  getBusList,
};
