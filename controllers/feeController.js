const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const AcademicYear = require("../models/academics/academicYearModel");
const User = require("../models/system/userModel");
const FeeGroup = require("../models/fees/feeGroupModel");

// @desc    Get all fee-groups
// @route   GET /api/fee/fee-group
// @access  Private
const getFeeGroups = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const searchField = req.query.sf;
  const searchValue = req.query.sv;

  const query = {};

  if (C.isManager(req.user.type)) query.manager = req.user._id;
  else if (C.isSchool(req.user.type)) query.school = req.user._id;

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = ["name"];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
  }

  const results = await UC.paginatedQuery(
    FeeGroup,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a fee-group
// @route   GET /api/fee/fee-group/:id
// @access  Private
const getFeeGroup = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const feeGroup = await FeeGroup.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!feeGroup) {
    res.status(404);
    throw new Error(C.getResourse404Error("FeeGroup", req.params.id));
  }

  res.status(200).json(feeGroup);
});

// @desc    Add a fee-group
// @route   POST /api/fee/fee-group
// @access  Private
const addFeeGroup = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;
  const ayear = req.body.ayear;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await User.any({ _id: manager, type: C.MANAGER }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await User.any({ _id: school, type: C.SCHOOL, manager }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  // Validate AcademicYear
  if (!ayear) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ayear"));
  }

  if (!(await AcademicYear.any({ _id: ayear, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("ayear", ayear));
  }

  const feeGroup = await FeeGroup.create({
    name: req.body.name,
    description: req.body.desc,
    academic_year: ayear,
    manager,
    school,
  });

  res.status(201).json({ msg: feeGroup._id });
});

// @desc    Update a fee-group
// @route   PUT /api/fee/fee-group/:id
// @access  Private
const updateFeeGroup = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await FeeGroup.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Error("FeeGroup", req.params.id));
  }

  const result = await FeeGroup.updateOne(query, {
    $set: { name: req.body.name },
  });

  res.status(200).json(result);
});

// @desc    Delete a fee-group
// @route   DELETE /api/fee/fee-group/:id
// @access  Private
const deleteFeeGroup = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const feeGroup = await FeeGroup.findOne(query).select("_id").lean();

  if (!feeGroup) {
    res.status(400);
    throw new Error(C.getResourse404Error("FeeGroup", req.params.id));
  }

  if (await Class.any({ feeGroup: feeGroup._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeGroup", "Class"));
  }

  const result = await FeeGroup.deleteOne(query);

  res.status(200).json(result);
});

module.exports = {
  getFeeGroups,
  getFeeGroup,
  addFeeGroup,
  updateFeeGroup,
  deleteFeeGroup,
};
