const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const AcademicYear = require("../models/academics/academicYearModel");
const User = require("../models/system/userModel");
const FeeGroup = require("../models/fees/feeGroupModel");
const FeeType = require("../models/fees/feeTypeModel");
const FeeTerm = require("../models/fees/feeTermModel");
const FeeHead = require("../models/fees/feeHeadModel");
const Class = require("../models/academics/classModel");
const StudentType = require("../models/system/studentTypeModel");
const FeeStructure = require("../models/fees/feeStructureModel");

/** 1. Fee Group */

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

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
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
    $set: { name: req.body.name, description: req.body.desc },
  });

  res.status(200).json(result);
});

// @desc    Delete a fee-group
// @route   DELETE /api/fee/fee-group/:id
// @access  Private
const deleteFeeGroup = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const feeGroup = await FeeGroup.findOne(query).select("_id").lean();

  if (!feeGroup) {
    res.status(400);
    throw new Error(C.getResourse404Error("FeeGroup", req.params.id));
  }

  if (await FeeType.any({ fee_group: feeGroup._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeGroup", "FeeType"));
  }

  const result = await FeeGroup.deleteOne(query);

  res.status(200).json(result);
});

/** 2. Fee Type */

// @desc    Get all fee-types
// @route   GET /api/fee/fee-type
// @access  Private
const getFeeTypes = asyncHandler(async (req, res) => {
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
    FeeType,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a fee-type
// @route   GET /api/fee/fee-type/:id
// @access  Private
const getFeeType = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const feeType = await FeeType.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!feeType) {
    res.status(404);
    throw new Error(C.getResourse404Error("FeeType", req.params.id));
  }

  res.status(200).json(feeType);
});

// @desc    Add a fee-type
// @route   POST /api/fee/fee-type
// @access  Private
const addFeeType = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;
  const ayear = req.body.ayear;
  const feeGroup = req.body.group;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  // Validate FeeGroup
  if (!feeGroup) {
    res.status(400);
    throw new Error(C.getFieldIsReq("group"));
  }

  if (!(await FeeGroup.any({ _id: feeGroup, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("group", feeGroup));
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

  const feeType = await FeeType.create({
    name: req.body.name,
    description: req.body.desc,
    fee_group: feeGroup,
    academic_year: ayear,
    manager,
    school,
  });

  res.status(201).json({ msg: feeType._id });
});

// @desc    Update a fee-type
// @route   PUT /api/fee/fee-type/:id
// @access  Private
const updateFeeType = asyncHandler(async (req, res) => {
  const group = req.body.group;

  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await FeeType.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Error("FeeType", req.params.id));
  }

  if (group && !(await FeeGroup.any({ ...query, _id: group }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("group", group));
  }

  const result = await FeeType.updateOne(query, {
    $set: { name: req.body.name, description: req.body.desc, fee_group: group },
  });

  res.status(200).json(result);
});

// @desc    Delete a fee-type
// @route   DELETE /api/fee/fee-type/:id
// @access  Private
const deleteFeeType = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const feeType = await FeeType.findOne(query).select("_id").lean();

  if (!feeType) {
    res.status(400);
    throw new Error(C.getResourse404Error("FeeType", req.params.id));
  }

  if (await Class.any({ feeType: feeType._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeType", "Class"));
  }

  const result = await FeeType.deleteOne(query);

  res.status(200).json(result);
});

/** 3. Fee Term */

// @desc    Get all fee-terms
// @route   GET /api/fee/fee-term
// @access  Private
const getFeeTerms = asyncHandler(async (req, res) => {
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
    FeeTerm,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a fee-term
// @route   GET /api/fee/fee-term/:id
// @access  Private
const getFeeTerm = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const feeTerm = await FeeTerm.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!feeTerm) {
    res.status(404);
    throw new Error(C.getResourse404Error("FeeTerm", req.params.id));
  }

  res.status(200).json(feeTerm);
});

// @desc    Add a fee-term
// @route   POST /api/fee/fee-term
// @access  Private
const addFeeTerm = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;
  const year = req.body.year;
  const ayear = req.body.ayear;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  // Validate Year
  if (!year) {
    res.status(400);
    throw new Error(C.getFieldIsReq("year"));
  }

  if (isNaN(parseInt(year))) {
    res.status(400);
    throw new Error("Year can only be number");
  }

  if (year.length !== 4) {
    res.status(400);
    throw new Error("Year can only be of 4 digits");
  }

  // Validate startMonth
  if (!req.body.start_month) {
    res.status(400);
    throw new Error(C.getFieldIsReq("start_month"));
  }

  const startMonth = parseInt(req.body.start_month);

  if (isNaN(parseInt(startMonth))) {
    res.status(400);
    throw new Error("start_month can only be number");
  }

  if (startMonth > 12 || startMonth < 1) {
    res.status(400);
    throw new Error("start_month should be between 1 and 12.");
  }

  let name = "";
  switch (startMonth) {
    case 1:
      name = `Jan ${year}`;
      break;
    case 2:
      name = `Feb ${year}`;
      break;
    case 3:
      name = `Mar ${year}`;
      break;
    case 4:
      name = `Apr ${year}`;
      break;
    case 5:
      name = `May ${year}`;
      break;
    case 6:
      name = `Jun ${year}`;
      break;
    case 7:
      name = `Jul ${year}`;
      break;
    case 8:
      name = `Aug ${year}`;
      break;
    case 9:
      name = `Sep ${year}`;
      break;
    case 10:
      name = `Oct ${year}`;
      break;
    case 11:
      name = `Nov ${year}`;
      break;
    case 12:
      name = `Dec ${year}`;
      break;
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

  const feeTerm = await FeeTerm.create({
    name,
    term_type: req.body.term_type,
    year,
    start_month: req.body.start_month,
    late_fee_date: req.body.late_fee_date,
    academic_year: ayear,
    manager,
    school,
  });

  res.status(201).json({ msg: feeTerm._id });
});

// @desc    Update a fee-term
// @route   PUT /api/fee/fee-term/:id
// @access  Private
const updateFeeTerm = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await FeeTerm.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Error("FeeTerm", req.params.id));
  }

  const result = await FeeTerm.updateOne(query, {
    $set: {
      name: req.body.name,
      term_type: req.body.term_type,
      year: req.body.year,
      start_month: req.body.start_month,
      late_fee_date: req.body.late_fee_date,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a fee-term
// @route   DELETE /api/fee/fee-term/:id
// @access  Private
const deleteFeeTerm = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const feeTerm = await FeeTerm.findOne(query).select("_id").lean();

  if (!feeTerm) {
    res.status(400);
    throw new Error(C.getResourse404Error("FeeTerm", req.params.id));
  }

  if (await Class.any({ feeTerm: feeTerm._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeTerm", "Class"));
  }

  const result = await FeeTerm.deleteOne(query);

  res.status(200).json(result);
});

/** 4. Fee Head */

// @desc    Get all fee-heads
// @route   GET /api/fee/fee-head
// @access  Private
const getFeeHeads = asyncHandler(async (req, res) => {
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
    FeeHead,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a fee-head
// @route   GET /api/fee/fee-head/:id
// @access  Private
const getFeeHead = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const feeHead = await FeeHead.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!feeHead) {
    res.status(404);
    throw new Error(C.getResourse404Error("FeeHead", req.params.id));
  }

  res.status(200).json(feeHead);
});

// @desc    Add a fee-head
// @route   POST /api/fee/fee-head
// @access  Private
const addFeeHead = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;
  const feeType = req.body.fee_type;
  const ayear = req.body.ayear;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  // Validate FeeType
  if (!feeType) {
    res.status(400);
    throw new Error(C.getFieldIsReq("feeType"));
  }

  if (!(await FeeType.any({ _id: feeType, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("type", feeType));
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

  const feeHead = await FeeHead.create({
    name: req.body.name,
    alias: req.body.alias,
    fee_type: feeType,
    ledger: req.body.ledger,
    academic_year: ayear,
    manager,
    school,
  });

  res.status(201).json({ msg: feeHead._id });
});

// @desc    Update a fee-head
// @route   PUT /api/fee/fee-head/:id
// @access  Private
const updateFeeHead = asyncHandler(async (req, res) => {
  const feeType = req.body.type;

  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (feeType) {
    if (!(await FeeType.any({ _id: feeType, manager, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Error("type", feeType));
    }
  }

  const result = await FeeHead.updateOne(query, {
    $set: {
      name: req.body.name,
      alias: req.body.alias,
      fee_type: type,
      ledger: req.body.ledger,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a fee-head
// @route   DELETE /api/fee/fee-head/:id
// @access  Private
const deleteFeeHead = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const feeHead = await FeeHead.findOne(query).select("_id").lean();

  if (!feeHead) {
    res.status(400);
    throw new Error(C.getResourse404Error("FeeHead", req.params.id));
  }

  if (await Class.any({ feeHead: feeHead._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeHead", "Class"));
  }

  const result = await FeeHead.deleteOne(query);

  res.status(200).json(result);
});

/** 5. Fee Structure */

// @desc    Get all fee-structures
// @route   GET /api/fee/fee-structure
// @access  Private
const getFeeStructures = asyncHandler(async (req, res) => {
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
    FeeStructure,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a fee-structure
// @route   GET /api/fee/fee-structure/:id
// @access  Private
const getFeeStructure = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const feeStructure = await FeeStructure.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!feeStructure) {
    res.status(404);
    throw new Error(C.getResourse404Error("FeeStructure", req.params.id));
  }

  res.status(200).json(feeStructure);
});

// @desc    Add a fee-structure
// @route   POST /api/fee/fee-structure
// @access  Private
const addFeeStructure = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;
  const class_ = req.body.class;
  const feeTypes = req.body.fee_types;
  const ayear = req.body.ayear;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  // Validate class
  if (!class_) {
    res.status(400);
    throw new Error(C.getFieldIsReq("class"));
  }

  if (!(await Class.any({ _id: class_, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("class", class_));
  }

  // Validate feeTypes
  for (const fees of feeTypes) {
    // Validate FeeHead
    if (!fees.head) {
      res.status(400);
      throw new Error(C.getFieldIsReq("types.head"));
    }

    if (!(await FeeHead.any({ _id: fees.head, manager, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Error("types.head", fees.head));
    }

    // Validate amounts
    for (const amt of fees.amounts) {
      // Validate studentType
      if (!amt.type) {
        res.status(400);
        throw new Error(C.getFieldIsReq("types.head"));
      }

      if (!(await StudentType.any({ _id: amt.type, manager, school }))) {
        res.status(400);
        throw new Error(C.getResourse404Error("amounts.type", amt.type));
      }
    }
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

  const feeStructure = await FeeStructure.create({
    class: class_,
    fee_period: req.body.fee_period,
    stream: req.body.stream,
    fee_types: feeTypes,
    academic_year: ayear,
    manager,
    school,
  });

  res.status(201).json({ msg: feeStructure._id });
});

// @desc    Update a fee-structure
// @route   PUT /api/fee/fee-structure/:id
// @access  Private
const updateFeeStructure = asyncHandler(async (req, res) => {
  const class_ = req.body.class;
  const feeTypes = req.body.fee_types;

  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  // Validate class
  if (!class_) {
    if (!(await Class.any({ _id: class_, manager, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Error("class", class_));
    }
  }

  if (feeTypes.length > 0) {
    for (const fees of feeTypes) {
      // Validate FeeHead
      if (!fees.head) {
        res.status(400);
        throw new Error(C.getFieldIsReq("types.head"));
      }

      if (!(await FeeHead.any({ _id: fees.head, manager, school }))) {
        res.status(400);
        throw new Error(C.getResourse404Error("types.head", fees.head));
      }

      // Validate amounts
      for (const amt of fees.amounts) {
        // Validate studentType
        if (!amt.type) {
          res.status(400);
          throw new Error(C.getFieldIsReq("types.head"));
        }

        if (!(await StudentType.any({ _id: amt.type, manager, school }))) {
          res.status(400);
          throw new Error(C.getResourse404Error("amounts.type", amt.type));
        }
      }
    }
  }

  const result = await FeeStructure.updateOne(query, {
    $set: {
      class: class_,
      fee_period: req.body.fee_period,
      stream: req.body.stream,
      fee_types: feeTypes,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a fee-structure
// @route   DELETE /api/fee/fee-structure/:id
// @access  Private
const deleteFeeStructure = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const feeStructure = await FeeStructure.findOne(query).select("_id").lean();

  if (!feeStructure) {
    res.status(400);
    throw new Error(C.getResourse404Error("FeeStructure", req.params.id));
  }

  if (await Class.any({ feeStructure: feeStructure._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeStructure", "Class"));
  }

  const result = await FeeStructure.deleteOne(query);

  res.status(200).json(result);
});

module.exports = {
  getFeeGroups,
  getFeeGroup,
  addFeeGroup,
  updateFeeGroup,
  deleteFeeGroup,

  getFeeTypes,
  getFeeType,
  addFeeType,
  updateFeeType,
  deleteFeeType,

  getFeeTerms,
  getFeeTerm,
  addFeeTerm,
  updateFeeTerm,
  deleteFeeTerm,

  getFeeHeads,
  getFeeHead,
  addFeeHead,
  updateFeeHead,
  deleteFeeHead,

  getFeeStructures,
  getFeeStructure,
  addFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
};
