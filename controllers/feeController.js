const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const FeeGroup = require("../models/fees/feeGroupModel");
const FeeType = require("../models/fees/feeTypeModel");
const FeeTerm = require("../models/fees/feeTermModel");
const Class = require("../models/academics/classModel");
const StudentType = require("../models/studentInfo/boardingTypeModel");
const FeeStructure = require("../models/fees/feeStructureModel");
const FeeFine = require("../models/fees/feeFineModel");
const FeeConcession = require("../models/fees/feeConcessionModel");
const Student = require("../models/studentInfo/studentModel");
const SubWard = require("../models/studentInfo/subwardTypeModel");
const BoardingType = require("../models/studentInfo/boardingTypeModel");
const FeePayment = require("../models/fees/feePaidModel");

/** 1. Fee Group */

// @desc    Get all fee-groups
// @route   GET /api/fee/fee-group
// @access  Private
const getFeeGroups = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = { academic_year: req.ayear };

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
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

  const feeGroup = await FeeGroup.findOne(query).lean();

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
  const feeGroup = await FeeGroup.create({
    name: req.body.name,
    description: req.body.desc,
    academic_year: req.ayear,
    school: req.school,
  });

  res.status(201).json({ msg: feeGroup._id });
});

// @desc    Update a fee-group
// @route   PUT /api/fee/fee-group/:id
// @access  Private
const updateFeeGroup = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

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
  const search = req.query.search;

  const query = { academic_year: req.ayear };

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
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

  const feeType = await FeeType.findOne(query).lean();

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
    academic_year: req.ayear,
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
  const sort = req.query.sort || "year start_month";
  const search = req.query.search;

  const query = { academic_year: req.ayear };

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
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

  const feeTerm = await FeeTerm.findOne(query)
    .populate("academic_year", "title")
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
    name: req.body.name || name,
    term_type: req.body.term_type,
    year,
    start_month: req.body.start_month,
    late_fee_days: req.body.late_fee_days,
    academic_year: req.ayear,
    school: req.school,
  });

  res.status(201).json({ msg: feeTerm._id });
});

// @desc    Update a fee-term
// @route   PUT /api/fee/fee-term/:id
// @access  Private
const updateFeeTerm = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

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

/** 5. Fee Structure */

// @desc    Get all fee-structures
// @route   GET /api/fee/fee-structure
// @access  Private
const getFeeStructures = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = { academic_year: req.ayear };

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    FeeStructure,
    query,
    {},
    page,
    limit,
    sort,
    [
      "fee_term class fee_types.boarding_type fee_types.amounts.fee_type academic_year",
      "name",
    ]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a fee-structure
// @route   GET /api/fee/fee-structure/:id
// @access  Private
const getFeeStructure = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const feeStructure = await FeeStructure.findOne(query).lean();

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

  const feeTerms = await UC.validateFeeTerms(req.body.fee_terms, req.ayear);
  const classes = await UC.validateClasses(req.body.classes, req.ayear);

  // Validate feeTypes
  if (!feeTypes || feeTypes.length == 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("fee_types"));
  }

  for (const ft of feeTypes) {
    // Validate boarding_type
    if (!ft.boarding_type) {
      res.status(400);
      throw new Error(C.getFieldIsReq("fee_types.boarding_type"));
    }

    const bt = await BoardingType.findOne({ name: ft.boarding_type })
      .select("_id")
      .lean();

    if (!bt) {
      res.status(400);
      throw new Error(
        C.getResourse404Id("fee_types.boarding_type", ft.boarding_type)
      );
    }

    ft.boarding_type = bt._id;

    // Validate amounts
    if (!ft.amounts || ft.amounts.length == 0) {
      res.status(400);
      throw new Error(C.getFieldIsReq("fee_types.amounts"));
    }

    for (const amt of ft.amounts) {
      // Validate fee_type
      if (!amt.fee_type) {
        res.status(400);
        throw new Error(
          C.getFieldIsReq("fee_types.boarding_type.amounts.fee_type")
        );
      }

      const feeType = await FeeType.findOne({ name: amt.fee_type })
        .select("_id")
        .lean();

      if (!feeType) {
        res.status(400);
        throw new Error(
          C.getResourse404Id(
            "fee_types.boarding_type.amounts.fee_type",
            amt.fee_type
          )
        );
      }

      amt.fee_type = feeType._id;
    }
  }

  const feeStructures = [];
  for (const fee_term of feeTerms) {
    for (const c of classes) {
      if (await FeeStructure.any({ fee_term, class: c })) {
        const update = await FeeStructure.updateOne(
          { fee_term, class: c },
          { $set: { fee_types: feeTypes } }
        );

        feeStructures.push(update);
      } else {
        const feeStructure = await FeeStructure.create({
          fee_term,
          class: c,
          fee_types: feeTypes,
          academic_year: req.ayear,
          school: req.school,
        });

        feeStructures.push(feeStructure._id);
      }
    }
  }

  res.status(201).json({ total: feeStructures.length, msg: feeStructures });
});

// @desc    Update a fee-structure
// @route   PUT /api/fee/fee-structure/:id
// @access  Private
const updateFeeStructure = asyncHandler(async (req, res) => {
  const class_ = req.body.class;
  const feeTypes = req.body.fee_types;

  const query = { _id: req.params.id };

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
  const search = req.query.search;

  const query = { academic_year: req.ayear };

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    FeeFine,
    query,
    {},
    page,
    limit,
    sort,
    ["class fee_term boarding_type academic_year", "name"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a fee-fine
// @route   GET /api/fee/fee-fine/:id
// @access  Private
const getFeeFine = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const feeFine = await FeeFine.findOne(query)
    .populate("class fee_term boarding_type academic_year", "name")
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
  const classes = await UC.validateClasses(req.body.classes, req.ayear);
  const feeTerms = await UC.validateFeeTerms(req.body.fee_terms, req.ayear);
  const boardingTypes = await UC.validateBoardingTypes(req.body.boarding_types);

  const feeFines = [];
  for (const c of classes) {
    for (const ft of feeTerms) {
      for (const bt of boardingTypes) {
        if (await FeeFine.any({ class: c, fee_term: ft, boarding_type: bt })) {
          const update = await FeeFine.updateOne(
            { class: c, fee_term: ft, boarding_type: bt },
            { $set: { desc: req.body.desc } }
          );

          feeFines.push(update);
        } else {
          const feeFine = await FeeFine.create({
            class: c,
            fee_term: ft,
            boarding_type: bt,
            desc: req.body.desc,
            academic_year: req.ayear,
            school: req.school,
          });

          feeFines.push(feeFine._id);
        }
      }
    }
  }

  res.status(201).json({ total: feeFines.length, msg: feeFines });
});

// @desc    Update a fee-fine
// @route   PUT /api/fee/fee-fine/:id
// @access  Private
const updateFeeFine = asyncHandler(async (req, res) => {
  const class_ = req.body.class;
  const feeTerm = req.body.fee_term;
  const stuType = req.body.stu_type;

  const query = { _id: req.params.id };

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
  const search = req.query.search;

  const query = { academic_year: req.ayear };

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    FeeConcession,
    query,
    {},
    page,
    limit,
    sort,
    ["subward class fee_term fee_types.fee_type academic_year", "name"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a fee-concession
// @route   GET /api/fee/fee-concession/:id
// @access  Private
const getFeeConcession = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const feeConcession = await FeeConcession.findOne(query).lean();

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
  // Validate subward
  if (!req.body.subward) {
    res.status(400);
    throw new Error(C.getFieldIsReq("subward"));
  }

  const subward = await SubWard.findOne({
    name: req.body.subward.toUpperCase(),
  })
    .select("_id")
    .lean();

  if (!subward) {
    res.status(400);
    throw new Error(C.getResourse404Id("subward", req.body.subward));
  }

  // Validate class
  if (!req.body.class) {
    res.status(400);
    throw new Error(C.getFieldIsReq("class"));
  }

  const class_ = await Class.findOne({ name: req.body.class.toUpperCase() })
    .select("_id")
    .lean();

  if (!class_) {
    res.status(400);
    throw new Error(C.getResourse404Id("class", req.body.class));
  }

  const feeTerms = await UC.validateFeeTerms(req.body.fee_terms, req.ayear);

  // Validate fee_types
  if (!req.body.fee_types || req.body.fee_types.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("fee_types"));
  }

  for (const ft of req.body.fee_types) {
    if (!ft.fee_type) {
      res.status(400);
      throw new Error(C.getFieldIsReq("fee_types.fee_type"));
    }

    const feeType = await FeeType.findOne({ name: ft.fee_type.toUpperCase() })
      .select("_id")
      .lean();

    if (!feeType) {
      res.status(400);
      throw new Error(C.getResourse404Id("fee_types.fee_type", ft.fee_type));
    }

    ft.fee_type = feeType._id;
  }

  const feeConcessions = [];

  for (const ft of feeTerms) {
    if (
      await FeeConcession.any({
        subward: subward._id,
        class: class_._id,
        fee_term: ft._id,
      })
    ) {
      const update = await FeeConcession.updateOne(
        { subward: subward._id, class: class_._id, fee_term: ft._id },
        { $set: { fee_types: req.body.fee_types } }
      );

      feeConcessions.push(update);
    } else {
      const feeConcession = await FeeConcession.create({
        subward: subward._id,
        class: class_._id,
        fee_term: ft._id,
        fee_types: req.body.fee_types,
        academic_year: req.ayear,
        school: req.school,
      });

      feeConcessions.push(feeConcession._id);
    }
  }

  res.status(201).json({ total: feeConcessions.length, msg: feeConcessions });
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

// @desc    Calculate fees
// @route   POST /api/fee/calculate
// @access  Private
const calculateFees = asyncHandler(async (req, res) => {
  const admNo = req.body.adm_no;

  if (!admNo) {
    res.status(400);
    throw new Error(C.getFieldIsReq("adm_no"));
  }

  let stuSelect = "admission_no roll_no name class section stream gender ";
  stuSelect += "house doa phone father_details mother_details dob address ";
  stuSelect += "boarding_type sub_ward bus_pick bus_drop bus_stop";

  const student = await Student.findOne({
    admission_no: admNo,
    academic_year: req.ayear,
  })
    .select(stuSelect)
    .populate(
      "class section stream boarding_type sub_ward bus_pick bus_drop bus_stop",
      "name title"
    )
    .lean();

  if (!student) {
    res.status(400);
    throw new Error(C.getResourse404Id("Student", admNo));
  }

  const paidFeeTerms = await FeePayment.find({
    student: student._id,
    academic_year: req.ayear,
  })
    .select("fee_term")
    .lean();

  const feeTerms = await FeeTerm.find({
    _id: { $nin: paidFeeTerms.map((e) => e.fee_term) },
    academic_year: req.ayear,
  })
    .sort("year start_month")
    .lean();

  const result = {
    student,
    terms: [],
    total_amount: 0,
    total_concession: 0,
    total_fine: 0,
    total_final_amount: 0,
    total_paid_amount: 0,
  };

  for (const ft of feeTerms) {
    const termFee = await calcTermFee(student, ft, ayear);
    result.total_amount += termFee.amount;
    result.total_concession += termFee.concession;
    result.total_fine += termFee.fine;
    result.total_final_amount += termFee.final_amount;

    result.terms.push(termFee);
  }

  return res.status(200).json(result);
});

// @desc    Pay Term Fees
// @route   POST /api/fee/collect-fee
// @access  Private
const collectFee = asyncHandler(async (req, res) => {
  const admNo = req.body.adm_no;
  const fee_terms = req.body.fee_terms;

  if (!admNo) {
    res.status(400);
    throw new Error(C.getFieldIsReq("adm_no"));
  }

  if (!fee_terms || fee_terms.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("fee_terms"));
  }

  const student = await Student.findOne({
    admission_no: admNo,
    academic_year: req.ayear,
  })
    .select()
    .populate(
      "class section stream boarding_type sub_ward bus_pick bus_drop bus_stop"
    )
    .lean();

  if (!student) {
    res.status(400);
    throw new Error(C.getResourse404Id("Student", admNo));
  }

  const paidFeeTerms = await FeePayment.find({
    student: student._id,
    academic_year: req.ayear,
  })
    .select("fee_term")
    .lean();

  const feeTermList = await FeeTerm.find({
    _id: { $nin: paidFeeTerms.map((e) => e.fee_term) },
    academic_year: req.ayear,
  })
    .sort("year start_month")
    .lean();

  const feeTerms = [];
  for (let i = 0; i < fee_terms.length; i++) {
    const ft = await FeeTerm.findOne({
      name: fee_terms[i].toUpperCase(),
    }).lean();

    if (!ft) {
      res.status(400);
      throw new Error(C.getResourse404Id("fee_terms", fee_terms[i]));
    }

    if (feeTermList[i]._id.equals(ft._id)) {
      feeTerms.push(ft);
    } else {
      res.status(400);
      throw new Error("Invalid fee_terms order");
    }
  }

  const result = { terms: [] };

  for (const ft of feeTerms) {
    result.terms.push(await calcTermFee(student, ft, ayear));
  }

  res.status(400).json(result);
});

const calcTermFee = async (student, ft, ayear) => {
  const result = {
    term: ft.name,
    fee_types: [],
    amount: 0,
    concession: 0,
    fine: 0,
    final_amount: 0,
  };

  const feeStructure = await FeeStructure.findOne({
    fee_term: ft._id,
    class: student.class._id,
    stream: student.stream._id,
    academic_year: req.ayear,
  })
    .select("-school")
    .populate(
      "fee_term class stream fee_types.boarding_type fee_types.amounts.fee_type academic_year",
      "name"
    )
    .lean();

  if (!feeStructure) {
    throw new Error(
      `FeeStructure not available for FeeTerm, Class and Stream of given Student`
    );
  }

  const stuFeeStruct = feeStructure.fee_types.find((ele) =>
    ele.boarding_type._id.equals(student.boarding_type._id)
  );

  if (!stuFeeStruct) {
    res.status(404);
    throw new Error(`Student FeeStructure not found for their BoardingType`);
  }

  for (const fee of stuFeeStruct.amounts) {
    result.fee_types.push({ fee_type: fee.fee_type.name, amount: fee.amount });

    result.amount += fee.amount;
  }

  const feeConcession = await FeeConcession.findOne({
    subward: student.sub_ward._id,
    class: student.class._id,
    fee_term: ft._id,
    academic_year: req.ayear,
  })
    .populate("fee_types.fee_type", "name")
    .lean();

  for (const fee of stuFeeStruct.amounts) {
    const feeType = result.fee_types.find(
      (ele) => ele.fee_type === fee.fee_type.name
    );

    const feeConType = feeConcession
      ? feeConcession.fee_types.find((ele) =>
          ele.fee_type._id.equals(fee.fee_type._id)
        )
      : false;

    if (!feeConType) {
      feeType.concession = 0;
      continue;
    }

    let conAmt = 0;
    if (feeConType.is_percentage) {
      conAmt = fee.amount * (feeConType.amount / 100);
    } else conAmt = feeConType.amount;

    if (feeType) feeType.concession = conAmt;

    result.concession += conAmt;
  }

  const feeFine = await FeeFine.findOne({
    class: student.class,
    fee_term: ft._id,
    boarding_type: student.boarding_type,
    academic_year: req.ayear,
  })
    // .populate("class fee_term")
    .lean();

  if (!feeFine) {
    res.status(400);
    throw new Error(
      `FeeFine not available for Class, FeeTerm and BoardingType of given Student`
    );
  }

  result.final_amount = result.amount - result.concession + result.fine;

  return result;
};

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

  calculateFees,
  collectFee,
};
