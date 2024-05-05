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
const StudentType = require("../models/studentInfo/boardingTypeModel");
const FeeStructure = require("../models/fees/feeStructureModel");
const FeeFine = require("../models/fees/feeFineModel");
const FeeConcession = require("../models/fees/feeConcessionModel");
const Student = require("../models/studentInfo/studentModel");

/** 1. Fee Group */

// @desc    Get all fee-groups
// @route   GET /api/fee/fee-group
// @access  Private
const getFeeGroups = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const searchField = req.query.sf || "all";
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
    throw new Error(C.getResourse404Id("FeeGroup", req.params.id));
  }

  res.status(200).json(feeGroup);
});

// @desc    Add a fee-group
// @route   POST /api/fee/fee-group
// @access  Private
const addFeeGroup = asyncHandler(async (req, res) => {
  const ayear = await UC.getCurrentAcademicYear(req.school);

  const feeGroup = await FeeGroup.create({
    name: req.body.name,
    description: req.body.desc,
    academic_year: ayear,
    school: req.school,
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
    throw new Error(C.getResourse404Id("FeeGroup", req.params.id));
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
    throw new Error(C.getResourse404Id("FeeGroup", req.params.id));
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
  const searchField = req.query.sf || "all";
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
    throw new Error(C.getResourse404Id("FeeType", req.params.id));
  }

  res.status(200).json(feeType);
});

// @desc    Add a fee-type
// @route   POST /api/fee/fee-type
// @access  Private
const addFeeType = asyncHandler(async (req, res) => {
  const ayear = await UC.getCurrentAcademicYear(req.school);
  const feeGroup = req.body.group;

  // Validate FeeGroup
  if (!feeGroup) {
    res.status(400);
    throw new Error(C.getFieldIsReq("group"));
  }

  if (!(await FeeGroup.any({ _id: feeGroup }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("group", feeGroup));
  }

  const feeType = await FeeType.create({
    name: req.body.name,
    description: req.body.desc,
    fee_group: feeGroup,
    academic_year: ayear,
    school: req.school,
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
    throw new Error(C.getResourse404Id("FeeType", req.params.id));
  }

  if (group && !(await FeeGroup.any({ ...query, _id: group }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("group", group));
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
    throw new Error(C.getResourse404Id("FeeType", req.params.id));
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
  const searchField = req.query.sf || "all";
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
    throw new Error(C.getResourse404Id("FeeTerm", req.params.id));
  }

  res.status(200).json(feeTerm);
});

// @desc    Add a fee-term
// @route   POST /api/fee/fee-term
// @access  Private
const addFeeTerm = asyncHandler(async (req, res) => {
  const ayear = await UC.getCurrentAcademicYear(req.school);
  const year = req.body.year;

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

  const feeTerm = await FeeTerm.create({
    name,
    term_type: req.body.term_type,
    year,
    start_month: req.body.start_month,
    late_fee_date: req.body.late_fee_date,
    academic_year: ayear,
    school: req.school,
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
    throw new Error(C.getResourse404Id("FeeTerm", req.params.id));
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
    throw new Error(C.getResourse404Id("FeeTerm", req.params.id));
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
  const searchField = req.query.sf || "all";
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
    throw new Error(C.getResourse404Id("FeeHead", req.params.id));
  }

  res.status(200).json(feeHead);
});

// @desc    Add a fee-head
// @route   POST /api/fee/fee-head
// @access  Private
const addFeeHead = asyncHandler(async (req, res) => {
  const feeType = req.body.fee_type;
  const ayear = req.body.ayear;

  // Validate FeeType
  if (!feeType) {
    res.status(400);
    throw new Error(C.getFieldIsReq("feeType"));
  }

  if (!(await FeeType.any({ _id: feeType, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("type", feeType));
  }

  const feeHead = await FeeHead.create({
    name: req.body.name,
    alias: req.body.alias,
    fee_type: feeType,
    ledger: req.body.ledger,
    academic_year: ayear,
    manager,
    school: req.school,
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
      throw new Error(C.getResourse404Id("type", feeType));
    }
  }

  const result = await FeeHead.updateOne(query, {
    $set: {
      name: req.body.name,
      alias: req.body.alias,
      fee_type: feeType,
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
    throw new Error(C.getResourse404Id("FeeHead", req.params.id));
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
  const searchField = req.query.sf || "all";
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
    throw new Error(C.getResourse404Id("FeeStructure", req.params.id));
  }

  res.status(200).json(feeStructure);
});

// @desc    Add a fee-structure
// @route   POST /api/fee/fee-structure
// @access  Private
const addFeeStructure = asyncHandler(async (req, res) => {
  const feeTypes = req.body.fee_types;
  const ayear = req.body.ayear;

  if (!req.body.class) {
    res.status(400);
    throw new Error(C.getFieldIsReq("class"));
  }

  const class_ = await Class.findOne({ name: req.body.class })
    .select("_id")
    .lean();

  if (!class_) {
    res.status(400);
    throw new Error(C.getResourse404Id("class", req.body.class));
  }

  if (!req.body.fee_term) {
    res.status(400);
    throw new Error(C.getFieldIsReq("fee_term"));
  }

  const feeTerm = await FeeTerm.findOne({ name: req.body.fee_term })
    .select("_id")
    .lean();

  if (!feeTerm) {
    res.status(400);
    throw new Error(C.getResourse404Id("fee_term", req.body.fee_term));
  }

  // Validate feeTypes
  for (const fees of feeTypes) {
    // Validate FeeHead
    if (!fees.fee_head) {
      res.status(400);
      throw new Error(C.getFieldIsReq("fee_types.fee_head"));
    }

    if (!(await FeeHead.any({ _id: fees.fee_head, manager, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("fee_types.fee_head", fees.fee_head));
    }

    // Validate amounts
    for (const amt of fees.amounts) {
      // Validate studentType
      if (!amt.type) {
        res.status(400);
        throw new Error(C.getFieldIsReq("fee_types.amounts.type"));
      }

      if (!(await StudentType.any({ _id: amt.type, manager, school }))) {
        res.status(400);
        throw new Error(C.getResourse404Id("fee_types.amounts.type", amt.type));
      }
    }
  }

  const feeStructure = await FeeStructure.create({
    class: class_,
    fee_term: feeTerm._id,
    stream: req.body.stream,
    fee_types: feeTypes,
    academic_year: ayear,
    manager,
    school: req.school,
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
      throw new Error(C.getResourse404Id("class", class_));
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
        throw new Error(C.getResourse404Id("types.head", fees.head));
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
          throw new Error(C.getResourse404Id("amounts.type", amt.type));
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
    throw new Error(C.getResourse404Id("FeeStructure", req.params.id));
  }

  if (await Class.any({ feeStructure: feeStructure._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeStructure", "Class"));
  }

  const result = await FeeStructure.deleteOne(query);

  res.status(200).json(result);
});

/** 6. Fee Fine */

// @desc    Get all fee-fines
// @route   GET /api/fee/fee-fine
// @access  Private
const getFeeFines = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const searchField = req.query.sf || "all";
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
    FeeFine,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a fee-fine
// @route   GET /api/fee/fee-fine/:id
// @access  Private
const getFeeFine = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const feeFine = await FeeFine.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!feeFine) {
    res.status(404);
    throw new Error(C.getResourse404Id("FeeFine", req.params.id));
  }

  res.status(200).json(feeFine);
});

// @desc    Add a fee-fine
// @route   POST /api/fee/fee-fine
// @access  Private
const addFeeFine = asyncHandler(async (req, res) => {
  const class_ = req.body.class;
  const feeTerm = req.body.fee_term;
  const stuType = req.body.stu_type;
  const ayear = req.body.ayear;

  // Validate Class
  if (!class_) {
    res.status(400);
    throw new Error(C.getFieldIsReq("class"));
  }

  if (!(await Class.any({ _id: class_, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("class", class_));
  }

  // Validate FeeTerm
  if (!feeTerm) {
    res.status(400);
    throw new Error(C.getFieldIsReq("fee_term"));
  }

  if (!(await FeeTerm.any({ _id: feeTerm, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("fee_term", feeTerm));
  }

  // Validate StudentType
  if (!stuType) {
    res.status(400);
    throw new Error(C.getFieldIsReq("stu_type"));
  }

  if (!(await StudentType.any({ _id: stuType, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("stu_type", stuType));
  }

  const feeFine = await FeeFine.create({
    class: class_,
    fee_term: feeTerm,
    student_type: stuType,
    type: req.body.type,
    amount: req.body.amount,
    range: req.body.range,
    fixed: req.body.fixed,
    date_range: req.body.date_range,
    academic_year: ayear,
    manager,
    school: req.school,
  });

  res.status(201).json({ msg: feeFine._id });
});

// @desc    Update a fee-fine
// @route   PUT /api/fee/fee-fine/:id
// @access  Private
const updateFeeFine = asyncHandler(async (req, res) => {
  const class_ = req.body.class;
  const feeTerm = req.body.fee_term;
  const stuType = req.body.stu_type;

  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  // Validate Class
  if (!class_) {
    if (!(await Class.any({ _id: class_, manager, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("class", class_));
    }
  }

  // Validate FeeTerm
  if (feeTerm) {
    if (!(await FeeTerm.any({ _id: feeTerm, manager, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("fee_term", feeTerm));
    }
  }

  // Validate StudentType
  if (stuType) {
    if (!(await StudentType.any({ _id: stuType, manager, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("stu_type", stuType));
    }
  }

  const result = await FeeFine.updateOne(query, {
    $set: {
      class: class_,
      term: feeTerm,
      student_type: stuType,
      type: req.body.type,
      amount: req.body.amount,
      range: req.body.range,
      fixed: req.body.fixed,
      date_range: req.body.date_range,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a fee-fine
// @route   DELETE /api/fee/fee-fine/:id
// @access  Private
const deleteFeeFine = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const feeFine = await FeeFine.findOne(query).select("_id").lean();

  if (!feeFine) {
    res.status(400);
    throw new Error(C.getResourse404Id("FeeFine", req.params.id));
  }

  if (await Class.any({ feeFine: feeFine._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeFine", "Class"));
  }

  const result = await FeeFine.deleteOne(query);

  res.status(200).json(result);
});

/** 7. Fee Concession */

// @desc    Get all fee-concessions
// @route   GET /api/fee/fee-concession
// @access  Private
const getFeeConcessions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const searchField = req.query.sf || "all";
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
    FeeConcession,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a fee-concession
// @route   GET /api/fee/fee-concession/:id
// @access  Private
const getFeeConcession = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const feeConcession = await FeeConcession.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!feeConcession) {
    res.status(404);
    throw new Error(C.getResourse404Id("FeeConcession", req.params.id));
  }

  res.status(200).json(feeConcession);
});

// @desc    Add a fee-concession
// @route   POST /api/fee/fee-concession
// @access  Private
const addFeeConcession = asyncHandler(async (req, res) => {
  const stuType = req.body.stu_type;
  const class_ = req.body.class;
  const feeTerm = req.body.fee_term;
  const feeHeads = req.body.fee_heads;
  const ayear = req.body.ayear;

  // Validate StudentType
  if (!stuType) {
    res.status(400);
    throw new Error(C.getFieldIsReq("stu_type"));
  }

  if (!(await StudentType.any({ _id: stuType, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("stu_type", stuType));
  }

  // Validate Class
  if (!class_) {
    res.status(400);
    throw new Error(C.getFieldIsReq("class"));
  }

  if (!(await Class.any({ _id: class_, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("class", class_));
  }

  // Validate FeeTerm
  if (!feeTerm) {
    res.status(400);
    throw new Error(C.getFieldIsReq("fee_term"));
  }

  if (!(await FeeTerm.any({ _id: feeTerm, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("fee_term", feeTerm));
  }

  // Validate FeeHeads
  if (!feeHeads || feeHeads.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("fee_heads"));
  }

  for (const fh of feeHeads) {
    if (!(await FeeHead.any({ _id: fh.fee_head, manager, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("fee_heads", fh.fee_head));
    }
  }

  const feeConcession = await FeeConcession.create({
    type: stuType,
    class: class_,
    fee_term: feeTerm,
    fee_heads: feeHeads,
    academic_year: ayear,
    manager,
    school: req.school,
  });

  res.status(201).json({ msg: feeConcession._id });
});

// @desc    Update a fee-concession
// @route   PUT /api/fee/fee-concession/:id
// @access  Private
const updateFeeConcession = asyncHandler(async (req, res) => {
  const stuType = req.body.stu_type;
  const class_ = req.body.class;
  const feeTerm = req.body.fee_term;
  const feeHeads = req.body.fee_heads;

  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  // Validate StudentType
  if (stuType) {
    if (!(await StudentType.any({ _id: stuType, manager, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("stu_type", stuType));
    }
  }

  // Validate Class
  if (!class_) {
    if (!(await Class.any({ _id: class_, manager, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("class", class_));
    }
  }

  // Validate FeeTerm
  if (feeTerm) {
    if (!(await FeeTerm.any({ _id: feeTerm, manager, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("fee_term", feeTerm));
    }
  }

  // Validate FeeHeads
  if (feeHeads || feeHeads.length > 0) {
    for (const fh of feeHeads) {
      if (!(await FeeHead.any({ _id: fh.fee_head, manager, school }))) {
        res.status(400);
        throw new Error(C.getResourse404Id("fee_heads", fh.fee_head));
      }
    }
  }

  const result = await FeeConcession.updateOne(query, {
    $set: {
      type: stuType,
      class: class_,
      fee_term: feeTerm,
      fee_heads: feeHeads,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a fee-concession
// @route   DELETE /api/fee/fee-concession/:id
// @access  Private
const deleteFeeConcession = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const feeConcession = await FeeConcession.findOne(query).select("_id").lean();

  if (!feeConcession) {
    res.status(400);
    throw new Error(C.getResourse404Id("FeeConcession", req.params.id));
  }

  if (await Class.any({ feeConcession: feeConcession._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeConcession", "Class"));
  }

  const result = await FeeConcession.deleteOne(query);

  res.status(200).json(result);
});

// @desc    Generate fees
// @route   POST /api/fee/fee-concession/:id
// @access  Private
const generateFees = asyncHandler(async (req, res) => {
  const students = await Student.find();

  const feeStructure = await FeeStructure.findOne();
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

  getFeeFines,
  getFeeFine,
  addFeeFine,
  updateFeeFine,
  deleteFeeFine,

  getFeeConcessions,
  getFeeConcession,
  addFeeConcession,
  updateFeeConcession,
  deleteFeeConcession,
};
