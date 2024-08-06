const assert = require("node:assert");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const FeeGroup = require("../models/fees/feeGroupModel");
const FeeType = require("../models/fees/feeTypeModel");
const FeeTerm = require("../models/fees/feeTermModel");
const Class = require("../models/academics/classModel");
const FeeStructure = require("../models/fees/feeStructureModel");
const FeeFine = require("../models/fees/feeFineModel");
const FeeConcession = require("../models/fees/feeConcessionModel");
const Student = require("../models/studentInfo/studentModel");
const SubWard = require("../models/studentInfo/subwardTypeModel");
const BoardingType = require("../models/studentInfo/boardingTypeModel");
const FeePaid = require("../models/fees/feePaidModel");
const ManualFeePayment = require("../models/fees/manualFeePaymentModel");
const School = require("../models/system/schoolModel");
const User = require("../models/system/userModel");
const BusAssignment = require("../models/transport/busAssignModel");
const RazorpayFeePayment = require("../models/fees/razorpayFeePaymentModel");
const FEE = require("../utils/fees");
const LEDGER = require("../services/ledger");

const { createStudentFeeOrder } = require("../tools/razorpay");
const StudentFine = require("../models/fees/studentFineModel");
const StudentWaiver = require("../models/fees/studentWaiverModel");
const path = require("node:path");

// /** 1. Fee Group */

// // @desc    Get all fee-groups
// // @route   GET /api/fee/fee-group
// // @access  Private
// const getFeeGroups = asyncHandler(async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.rows) || 10;
//   const sort = req.query.sort || "name";
//   const search = req.query.search;

//   const query = { academic_year: req.ayear };

//   if (search) {
//     const fields = ["name"];

//     const searchQuery = UC.createSearchQuery(fields, search);
//     query["$or"] = searchQuery;
//   }

//   const results = await UC.paginatedQuery(
//     FeeGroup,
//     query,
//     {},
//     page,
//     limit,
//     sort
//   );

//   if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

//   res.status(200).json(results);
// });

// // @desc    Get a fee-group
// // @route   GET /api/fee/fee-group/:id
// // @access  Private
// const getFeeGroup = asyncHandler(async (req, res) => {
//   const query = { _id: req.params.id };

//   const feeGroup = await FeeGroup.findOne(query).lean();

//   if (!feeGroup) {
//     res.status(404);
//     throw new Error(C.getResourse404Id("FeeGroup", req.params.id));
//   }

//   res.status(200).json(feeGroup);
// });

// // @desc    Add a fee-group
// // @route   POST /api/fee/fee-group
// // @access  Private
// const addFeeGroup = asyncHandler(async (req, res) => {
//   const feeGroup = await FeeGroup.create({
//     name: req.body.name,
//     description: req.body.desc,
//     academic_year: req.ayear,
//   });

//   res.status(201).json({ msg: feeGroup._id });
// });

// // @desc    Update a fee-group
// // @route   PUT /api/fee/fee-group/:id
// // @access  Private
// const updateFeeGroup = asyncHandler(async (req, res) => {
//   const query = { _id: req.params.id };

//   if (!(await FeeGroup.any(query))) {
//     res.status(404);
//     throw new Error(C.getResourse404Id("FeeGroup", req.params.id));
//   }

//   const result = await FeeGroup.updateOne(query, {
//     $set: { name: req.body.name, description: req.body.desc },
//   });

//   res.status(200).json(result);
// });

// // @desc    Delete a fee-group
// // @route   DELETE /api/fee/fee-group/:id
// // @access  Private
// const deleteFeeGroup = asyncHandler(async (req, res) => {
//   const query = { _id: req.params.id };

//   const feeGroup = await FeeGroup.findOne(query).select("_id").lean();

//   if (!feeGroup) {
//     res.status(400);
//     throw new Error(C.getResourse404Id("FeeGroup", req.params.id));
//   }

//   if (await FeeType.any({ fee_group: feeGroup._id })) {
//     res.status(400);
//     throw new Error(C.getUnableToDel("FeeGroup", "FeeType"));
//   }

//   const result = await FeeGroup.deleteOne(query);

//   res.status(200).json(result);
// });

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

  // Filters
  // if (req.query.fee_group) {
  //   const feeGroup = await FeeGroup.findOne({
  //     name: req.query.fee_group.toUpperCase(),
  //   })
  //     .select("_id")
  //     .lean();

  //   if (feeGroup) query.class = feeGroup._id;
  // }

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    FeeType,
    query,
    {},
    page,
    limit,
    sort
    // ["fee_group", "name"]
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
  // // Validate FeeGroup
  // if (!req.body.group) {
  //   res.status(400);
  //   throw new Error(C.getFieldIsReq("group"));
  // }

  // const feeGroup = await FeeGroup.findOne({
  //   name: req.body.group.toUpperCase(),
  // })
  //   .select("_id")
  //   .lean();

  // if (!feeGroup) {
  //   res.status(400);
  //   throw new Error(C.getResourse404Id("group", req.body.group));
  // }

  const feeType = await FeeType.create({
    name: req.body.name,
    description: req.body.desc,
    // fee_group: feeGroup._id,
    academic_year: req.ayear,
  });

  res.status(201).json({ msg: feeType._id });
});

// @desc    Update a fee-type
// @route   PUT /api/fee/fee-type/:id
// @access  Private
const updateFeeType = asyncHandler(async (req, res) => {
  // const group = req.body.fee_group;

  const query = { _id: req.params.id };

  if (!(await FeeType.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("FeeType", req.params.id));
  }

  // if (group && !(await FeeGroup.any({ ...query, _id: group }))) {
  //   res.status(400);
  //   throw new Error(C.getResourse404Id("group", group));
  // }

  const result = await FeeType.updateOne(query, {
    $set: { name: req.body.name, description: req.body.desc }, // , fee_group: group
  });

  res.status(200).json(result);
});

// @desc    Delete a fee-type
// @route   DELETE /api/fee/fee-type/:id
// @access  Private
const deleteFeeType = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const feeType = await FeeType.findOne(query).select("_id").lean();

  if (!feeType) {
    res.status(400);
    throw new Error(C.getResourse404Id("FeeType", req.params.id));
  }

  if (
    await FeeStructure.any({
      $or: [
        { "one_time_fees.fee_type": feeType._id },
        { "term_fees.fee_type": feeType._id },
        { "partial_fees.fee_type": feeType._id },
      ],
    })
  ) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeType", "FeeStructure"));
  }

  if (await FeeConcession.any({ "fee_types.fee_type": feeType._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeType", "FeeConcession"));
  }

  if (await StudentWaiver.any({ fee_type: feeType._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeType", "StudentWaiver"));
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
    query["$or"] = searchQuery;
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

  const feeTerm = await FeeTerm.findOne(query).select("_id").lean();

  if (!feeTerm) {
    res.status(400);
    throw new Error(C.getResourse404Id("FeeTerm", req.params.id));
  }

  if (await FeeConcession.any({ fee_term: feeTerm._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeTerm", "FeeConcession"));
  }

  if (await StudentFine.any({ fee_term: feeTerm._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeTerm", "StudentFine"));
  }

  if (await StudentWaiver.any({ fee_term: feeTerm._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("FeeTerm", "StudentWaiver"));
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

  // Filters
  if (req.query.class_name) {
    query.class = await UC.validateClassByName(req.query.class_name, req.ayear);
  }

  if (req.query.boarding_type) {
    query.boarding_type = await UC.validateBoardingTypeByName(
      req.query.boarding_type
    );
  }

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const populateConfigs = [
    { path: "class boarding_type", select: "name" },
    { path: "one_time_fees.fee_type", select: "name" },
    { path: "term_fees.fee_type", select: "name" },
    { path: "partial_fees.fee_type", select: "name" },
    { path: "academic_year", select: "title" },
  ];

  const results = await UC.paginatedQueryProPlus(
    FeeStructure,
    query,
    {},
    page,
    limit,
    sort,
    populateConfigs
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  // for (const data of results.result) {
  //   const className = data.student.class.name;
  //   const sectionName = data.student.section.name;
  //   const streamName = data.student.stream.name;
  //   data.student.class =
  //     streamName === "NA"
  //       ? `${className}-${sectionName}`
  //       : `${className}-${sectionName} ${streamName}`;

  //   delete data.student.section;
  //   delete data.student.stream;

  //   for (const otf of data.one_time_fees) {
  //     otf.fee_type = otf.fee_type.name;
  //   }

  //   for (const tf of data.term_fees) {
  //     tf.fee_term = tf.fee_term.name;

  //     for (const amt of tf.amounts) {
  //       amt.fee_type = amt.fee_type.name;
  //     }
  //   }

  //   data.academic_year = data.academic_year.title;
  // }

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
  const classIds = await UC.validateClassesFromName(
    req.body.classes,
    req.ayear
  );

  const boardingTypes = await UC.validateBoardingTypesFromName(
    req.body.boarding_types
  );

  const oneTimeFeesRaw = req.body.one_time_fees;

  // Validate oneTimeFeesRaw
  if (!oneTimeFeesRaw || oneTimeFeesRaw.length == 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("one_time_fees"));
  }

  const oneTimeFees = [];
  for (const data of oneTimeFeesRaw) {
    const feeTypeId = await UC.validateFeeTypeByName(
      data.fee_type,
      req.ayear,
      "one_time_fees.fee_type"
    );

    if (!data.amount) {
      res.status(400);
      throw new Error("one_time_fees.amount");
    }

    oneTimeFees.push({
      fee_type: feeTypeId,
      amount: data.amount,
    });
  }

  const termFeesRaw = req.body.term_fees;

  // Validate termFeesRaw
  if (!termFeesRaw || termFeesRaw.length == 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("term_fee_types"));
  }

  const termFees = [];
  for (const data of termFeesRaw) {
    const feeTypeId = await UC.validateFeeTypeByName(
      data.fee_type,
      req.ayear,
      "term_fees.fee_type"
    );

    if (!data.amount) {
      res.status(400);
      throw new Error("term_fees.amount");
    }

    termFees.push({
      fee_type: feeTypeId,
      amount: data.amount,
    });
  }

  const partialFeesRaw = req.body.partial_fees || [];

  // Validate partialFeesRaw

  const partialFees = [];
  for (const data of partialFeesRaw) {
    const feeTypeId = await UC.validateFeeTypeByName(
      data.fee_type,
      req.ayear,
      "partial_fees.fee_type"
    );

    if (!data.amount_per_term) {
      res.status(400);
      throw new Error("partial_fees.amount_per_term");
    }

    partialFees.push({
      fee_type: feeTypeId,
      amount: data.amount_per_term,
    });
  }

  let updateCount = 0;
  let createCount = 0;
  for (const cId of classIds) {
    for (const btId of boardingTypes) {
      const query = { class: cId, boarding_type: btId };

      if (await FeeStructure.any(query)) {
        const update = await FeeStructure.updateOne(query, {
          $set: {
            one_time_fees: oneTimeFees,
            term_fees: termFees,
            partial_fees: partialFees,
          },
        });

        updateCount++;
      } else {
        const feeStructure = await FeeStructure.create({
          class: cId,
          boarding_type: btId,
          one_time_fees: oneTimeFees,
          term_fees: termFees,
          partial_fees: partialFees,
          academic_year: req.ayear,
        });

        createCount++;
      }
    }
  }

  res.status(201).json({ created: createCount, updated: updateCount });
});

// @desc    Delete a fee-structure
// @route   DELETE /api/fee/fee-structure/:id
// @access  Private
const deleteFeeStructure = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const feeStructure = await FeeStructure.findOne(query).select("_id").lean();

  if (!feeStructure) {
    res.status(400);
    throw new Error(C.getResourse404Id("FeeStructure", req.params.id));
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
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    FeeFine,
    query,
    {},
    page,
    limit,
    sort,
    ["class fee_term boarding_type academic_year", "name stream"]
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
  const boardingTypes = await UC.validateBoardingTypesFromName(
    req.body.boarding_types
  );

  const { type, amount } = req.body;

  const custom = [];

  if (type === C.CUSTOM) {
    if (!req.body.custom || req.body.custom.length === 0) {
      res.status(400);
      throw new Error(C.getFieldIsReq("custom"));
    }

    custom = req.body.custom.sort((a, b) => {
      const toA = new Date(a.to || 0);
      const toB = new Date(b.to || 0);
      if (toA > toB) return 1;
      if (toA < toB) return -1;
      return 0;
    });
  } else {
    if (!amount) {
      res.status(400);
      throw new Error(C.getFieldIsReq("amount"));
    }
  }

  let createCount = 0;
  let updateCount = 0;
  for (const bt of boardingTypes) {
    const query = { boarding_type: bt, academic_year: req.ayear };
    if (await FeeFine.any(query)) {
      await FeeFine.updateOne(query, { $set: { type, amount, custom } });

      updateCount++;
    } else {
      await FeeFine.create({
        boarding_type: bt,
        type,
        amount,
        custom,
        academic_year: req.ayear,
      });

      createCount++;
    }
  }

  res.status(200).json({
    total_created: createCount,
    total_updated: updateCount,
  });
});

// @desc    Delete a fee-fine
// @route   DELETE /api/fee/fee-fine/:id
// @access  Private
const deleteFeeFine = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const feeFine = await FeeFine.findOne(query).select("_id").lean();

  if (!feeFine) {
    res.status(400);
    throw new Error(C.getResourse404Id("FeeFine", req.params.id));
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

  // Filters
  if (req.query.subward) {
    const subward = await SubWard.findOne({
      name: req.query.subward.toUpperCase(),
    })
      .select("_id")
      .lean();

    if (subward) query.subward = subward._id;
  }

  if (req.query.class_name) {
    query.class = await UC.validateClassByName(req.query.class_name, req.ayear);
  }

  if (req.query.term) {
    const feeTerm = await FeeTerm.findOne({
      name: req.query.term.toUpperCase(),
    })
      .select("_id")
      .lean();

    if (feeTerm) query.fee_term = feeTerm._id;
  }

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
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
  const classIds = await UC.validateClassesFromName(
    req.body.class_names,
    req.ayear
  );
  const boardingId = await UC.validateBoardingTypeByName(
    req.body.boarding_type
  );
  const feeTerms = await UC.validateFeeTermsFromName(
    req.body.fee_terms,
    req.ayear
  );

  // Validate fee_types
  if (!req.body.fee_types || req.body.fee_types.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("fee_types"));
  }

  for (const ft of req.body.fee_types) {
    const feeTypeId = await UC.validateFeeTypeByName(ft.fee_type, req.ayear);

    ft.fee_type = feeTypeId;
  }

  const students = await Student.find({
    class: classIds,
    boarding_type: boardingId,
  })
    .select("_id")
    .lean();

  let createCount = 0;
  let updateCount = 0;

  for (const s of students) {
    for (const ft of feeTerms) {
      const query = {
        student: s._id,
        fee_term: ft._id,
        academic_year: req.ayear,
      };

      if (await FeeConcession.any(query)) {
        await FeeConcession.updateOne(query, {
          $set: { fee_types: req.body.fee_types },
        });

        updateCount++;
      } else {
        await FeeConcession.create({
          student: s._id,
          fee_term: ft._id,
          fee_types: req.body.fee_types,
          academic_year: req.ayear,
        });

        createCount++;
      }
    }
  }

  res.status(200).json({
    total_students: students.length,
    total_created: createCount,
    total_updated: updateCount,
  });
});

// @desc    Delete a fee-concession
// @route   DELETE /api/fee/fee-concession/:id
// @access  Private
const deleteFeeConcession = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const feeConcession = await FeeConcession.findOne(query).select("_id").lean();

  if (!feeConcession) {
    res.status(400);
    throw new Error(C.getResourse404Id("FeeConcession", req.params.id));
  }

  const result = await FeeConcession.deleteOne(query);

  res.status(200).json(result);
});

/** 8. Student Fine */

// @desc    Get all student-fines
// @route   GET /api/fee/student-fine
// @access  Private
const getStudentFines = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "createdAt";
  const search = req.query.search;

  const query = { academic_year: req.ayear };

  if (search) {
    const fields = ["note"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const populateConfigs = [
    {
      path: "student",
      select: "admission_no name",
      populate: {
        path: "class section stream boarding_type academic_year",
        select: "name title",
      },
    },
    { path: "fee_term", select: "name" },
    { path: "academic_year", select: "title" },
  ];

  const results = await UC.paginatedQueryProPlus(
    StudentFine,
    query,
    {},
    page,
    limit,
    sort,
    populateConfigs
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a student-fine
// @route   GET /api/fee/student-fine/:id
// @access  Private
const getStudentFine = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const studentFine = await StudentFine.findOne(query)
    .populate({
      path: "student",
      select: "admission_no name",
      populate: {
        path: "class section stream boarding_type academic_year",
        select: "name title",
      },
    })
    .populate("fee_term academic_year", "name title")
    .lean();

  if (!studentFine) {
    res.status(404);
    throw new Error(C.getResourse404Id("StudentFine", req.params.id));
  }

  res.status(200).json(studentFine);
});

// @desc    Add a student-fine
// @route   POST /api/fee/student-fine
// @access  Private
const addStudentFine = asyncHandler(async (req, res) => {
  const query = {};

  const admNo = req.body.adm_no;
  const { amount, note } = req.body;

  if (!admNo) {
    const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
      req.body.class_section_names,
      req.ayear
    );
    const boardingIds = await UC.validateBoardingTypesFromName(
      req.body.boarding_types
    );

    query.class = classIds;
    query.section = secIds;
    query.boarding_type = boardingIds;
  } else query.admission_no = admNo;

  const students = await Student.find(query).select("_id").lean();

  const feeTerms = await UC.validateFeeTermsFromName(
    req.body.fee_terms,
    req.ayear
  );

  const result = [];

  for (const s of students) {
    for (const ft of feeTerms) {
      const fine = await StudentFine.create({
        student: s._id,
        fee_term: ft._id,
        amount,
        note,
        academic_year: req.ayear,
      });

      result.push(fine._id);
    }
  }

  res.status(201).json({ total: result.length, msg: result });
});

// @desc    Add a student-fine
// @route   PATCH /api/fee/student-fine/:id
// @access  Private
const updateStudentFine = asyncHandler(async (req, res) => {
  if (!(await StudentFine.any({ _id: req.params.id }))) {
    res.status(404);
    throw new Error(C.getResourse404Id("StudentFine", req.params.id));
  }

  const update = await StudentFine.updateMany(
    { _id: req.params.id },
    { amount: req.body.amount, note: req.body.note }
  );

  res.status(200).json(update);
});

// @desc    Delete a student-fine
// @route   DELETE /api/fee/student-fine/:id
// @access  Private
const deleteStudentFine = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const studentFine = await StudentFine.findOne(query).select("_id").lean();

  if (!studentFine) {
    res.status(400);
    throw new Error(C.getResourse404Id("StudentFine", req.params.id));
  }

  const result = await StudentFine.deleteOne(query);

  res.status(200).json(result);
});

/** 9. Student Concession */

// @desc    Get all student-waivers
// @route   GET /api/fee/student-waiver
// @access  Private
const getStudentWaivers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "createdAt";
  const search = req.query.search;

  const query = { academic_year: req.ayear };

  if (search) {
    const fields = ["note"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const populateConfigs = [
    {
      path: "student",
      select: "admission_no name",
      populate: {
        path: "class section stream boarding_type academic_year",
        select: "name title",
      },
    },
    { path: "fee_types.fee_type fee_term academic_year", select: "name title" },
  ];

  const results = await UC.paginatedQueryProPlus(
    StudentWaiver,
    query,
    {},
    page,
    limit,
    sort,
    populateConfigs
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a student-waiver
// @route   GET /api/fee/student-waiver/:id
// @access  Private
const getStudentWaiver = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const studentWaiver = await StudentWaiver.findOne(query)
    .populate({
      path: "student",
      select: "admission_no name",
      populate: {
        path: "class section stream boarding_type academic_year",
        select: "name title",
      },
    })
    .populate("fee_types.fee_type fee_term academic_year", "name title")
    .lean();

  if (!studentWaiver) {
    res.status(404);
    throw new Error(C.getResourse404Id("StudentWaiver", req.params.id));
  }

  res.status(200).json(studentWaiver);
});

// @desc    Add a student-waiver
// @route   POST /api/fee/student-waiver
// @access  Private
const addStudentWaiver = asyncHandler(async (req, res) => {
  const query = {};

  const admNo = req.body.adm_no;

  if (!admNo) {
    const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
      req.body.class_section_names,
      req.ayear
    );
    const boardingIds = await UC.validateBoardingTypesFromName(
      req.body.boarding_types
    );

    query.class = classIds;
    query.section = secIds;
    query.boarding_type = boardingIds;
  } else query.admission_no = admNo;

  const students = await Student.find(query).select("_id").lean();

  const feeTerms = await UC.validateFeeTermsFromName(
    req.body.fee_terms,
    req.ayear
  );

  const feeTypes = [];
  for (const ft of req.body.fee_types) {
    const feeTypeId = await UC.validateFeeTypeByName(ft.fee_type, req.ayear);

    feeTypes.push({ fee_type: feeTypeId, amount: ft.amount });
  }

  const result = [];

  for (const s of students) {
    for (const ft of feeTerms) {
      const waiver = await StudentWaiver.create({
        student: s._id,
        fee_term: ft._id,
        fee_types: feeTypes,
        note: req.body.note,
        academic_year: req.ayear,
      });

      result.push(waiver._id);
    }
  }

  res.status(201).json({ total: result.length, msg: result });
});

// @desc    Add a student-waiver
// @route   PATCH /api/fee/student-waiver/:id
// @access  Private
const updateStudentWaiver = asyncHandler(async (req, res) => {
  if (!(await StudentWaiver.any({ _id: req.params.id }))) {
    res.status(404);
    throw new Error(C.getResourse404Id("StudentWaiver", req.params.id));
  }

  const feeTypes = [];
  for (const ft of req.body.fee_types) {
    const feeTypeId = await UC.validateFeeTypeByName(ft.fee_type, req.ayear);

    feeTypes.push({ fee_type: feeTypeId, amount: ft.amount });
  }

  const update = await StudentWaiver.updateMany(
    { _id: req.params.id },
    { fee_types: feeTypes, note: req.body.note }
  );

  res.status(200).json(update);
});

// @desc    Delete a student-waiver
// @route   DELETE /api/fee/student-waiver/:id
// @access  Private
const deleteStudentWaiver = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const studentWaiver = await StudentWaiver.findOne(query).select("_id").lean();

  if (!studentWaiver) {
    res.status(400);
    throw new Error(C.getResourse404Id("StudentWaiver", req.params.id));
  }

  const result = await StudentWaiver.deleteOne(query);

  res.status(200).json(result);
});

// @desc    Get paid fees
// @route   GET /api/fee/payments
// @access  Private
const getFeePayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "-createdAt";

  const query = {};
  const stuQuery = { academic_year: req.ayear };

  if (req.query.adm_no) {
    stuQuery.admission_no = req.query.adm_no.toUpperCase();
  }

  if (
    req.query.class_section_names &&
    !req.query.class_section_names.includes("total")
  ) {
    const classSectionNames = req.query.class_section_names.split(",");

    const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
      classSectionNames,
      req.ayear
    );

    stuQuery.class = classIds;
    stuQuery.section = secIds;
  }

  if (req.query.boarding_type) {
    const bt = await UC.validateBoardingTypeByName(req.query.boarding_type);

    stuQuery.boarding_type = bt;
  }

  if (req.query.student_status) {
    const status = req.query.student_status.toLowerCase();

    if (status !== "n" || status !== "o") {
      res.status(400);
      throw new Error(`student_status values can only be 'n' or 'o'`);
    }

    stuQuery.student_status = status;
  }

  if (req.query.from_date) {
    const from = UC.validateAndSetDate(req.query.from_date, "from_date");

    query.createdAt = { $gt: from };
  }

  if (req.query.to_date) {
    const to = UC.validateAndSetDate(req.query.to_date, "to_date");

    query.createdAt = { ...query.createdAt, $lt: to };
  }

  if (req.query.user && (UC.isAdmins(req.user) || UC.isSchool(req.school))) {
    const user = await User.findById(req.query.user).select("_id").lean();
    if (!user) {
      res.status(400);
      throw new Error(C.getResourse404Id("user", req.query.user));
    }

    const manualPayments = await ManualFeePayment.find({
      collected_by: user._id,
    })
      .select("_id")
      .lean();

    query.manual_fee_payment = manualPayments.map((ele) => ele._id);
  }

  if (req.query.fee_term) {
    query.fee_term = await UC.validateFeeTermByName(
      req.query.fee_term,
      req.ayear
    );
  }

  const students = await Student.find(stuQuery).select("_id").lean();

  query.student = students.map((ele) => ele._id);

  const populateConfigs = [
    {
      path: "student",
      select: "admission_no name",
      populate: { path: "class section stream boarding_type", select: "name" },
    },
    { path: "razorpay_payments" },
    {
      path: "manual_fee_payments",
      populate: { path: "collected_by", select: "name" },
    },
    { path: "one_time_fees.fee_type", select: "name" },
    { path: "term_fees.fee_term", select: "name" },
    { path: "term_fees.fee_types.fee_type", select: "name" },
    { path: "partial_fees.fee_term", select: "name" },
    { path: "partial_fees.fee_types.fee_type", select: "name" },
  ];

  const results = await UC.paginatedQueryProPlus(
    FeePaid,
    query,
    "",
    page,
    limit,
    sort,
    populateConfigs
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  const result = [];
  for (const data of results.result) {
    const studentData = {
      admission_no: data.student.admission_no,
      name: data.student.name,
      class: UC.getStudentClassTitle(data.student),
      section: data.student.section.name,
      boarding_type: data.student.boarding_type.name,
    };

    const payments = [];

    for (const rp of data.razorpay_payments) {
      const [oneTimeFees, termFees, partialFees] = FEE.splitFeesArrays(
        rp.paid_for
      );

      const paidTerms = `${termFees[0]} to ${termFees.slice(-1)}`;

      payments.push({
        ...studentData,
        paid_terms: paidTerms,
        collected_by: "Razorpay",
        collected_on: UC.convAndFormatDate(rp.createdAt),
        remarks: "Collected from online portal",
      });
    }

    for (const mfp of data.manual_fee_payments) {
      const [oneTimeFees, termFees, partialFees] = FEE.splitFeesArrays(
        mfp.paid_for
      );

      const paidTerms = `${termFees[0]} to ${termFees.slice(-1)}`;

      payments.push({
        ...studentData,
        paid_terms: paidTerms,
        collected_by: mfp.collected_by.name,
        collected_on: UC.convAndFormatDate(mfp.createdAt),
        remarks: "Collected from school",
      });
    }

    result.push(
      ...payments.sort((a, b) => {
        if (a.collected_on > b.collected_on) return 1;
        if (a.collected_on < b.collected_on) return -1;
        return 0;
      })
    );
  }

  results.result = result;

  res.status(200).json(results);
});

// @desc    Get due fees
// @route   GET /api/fee/due
// @access  Private
const getDueFees = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = { academic_year: req.ayear };

  if (req.query.adm_no) query.admission_no = req.query.adm_no.toUpperCase();

  if (req.query.class_section_names) {
    const classSectionNames = req.query.class_section_names.split(",");

    const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
      classSectionNames,
      req.ayear
    );

    query.class = classIds;
    query.section = secIds;
  }

  if (search) {
    const fields = ["admission_no", "name", "email", "phone"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    Student,
    query,
    {},
    page,
    limit,
    sort,
    [
      "class section stream boarding_type sub_ward bus_pick bus_drop bus_stop",
      "name",
    ]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  const result = [];
  for (const s of results.result) {
    const feeData = await FEE.calcStudentFees(s.admission_no, req.ayear);
    const dueFees = FEE.combineFeesArrays(
      feeData.one_time_fees,
      feeData.term_fees,
      feeData.partial_fees
    );

    const streamName = s.stream.name === "NA" ? "" : ` (${s.stream.name})`;
    const className = `${s.class.name}-${s.section.name}${streamName}`;

    const startTerm = dueFees[0];
    const endTerm = dueFees[dueFees.length - 1];

    const feetypesObj = {};
    let total = 0;
    for (const term of dueFees) {
      for (const ft of term.fee_types) {
        const ftName = ft.fee_type.replaceAll(" ", "_");

        if (!feetypesObj[ftName] && feetypesObj[ftName] !== 0) {
          feetypesObj[ftName] = ft.amount;
        } else feetypesObj[ftName] += ft.amount;
      }

      total += term.term_due;
    }

    result.push({
      class: className,
      admission_no: s.admission_no,
      name: s.name,
      father_name: s.father_details.name,
      phone: s.phone,
      boarding_type: s.boarding_type.name,
      subward: s.sub_ward.name,
      pending_from: startTerm.term,
      pending_till: endTerm.term,
      ...feetypesObj,
      total,
    });
  }

  delete results.result;
  results.result = result;

  res.status(200).json(results);
});

// @desc    Get student fee report
// @route   GET /api/fee/report
// @access  Private
const getFeeReport = asyncHandler(async (req, res) => {
  const stuQuery = { academic_year: req.ayear };

  if (req.query.adm_no) {
    stuQuery.admission_no = req.query.adm_no.toUpperCase();
  }

  if (
    req.query.class_section_names &&
    !req.query.class_section_names.includes("total")
  ) {
    const classSectionNames = req.query.class_section_names.split(",");

    const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
      classSectionNames,
      req.ayear
    );

    stuQuery.class = classIds;
    stuQuery.section = secIds;
  }

  if (req.query.boarding_type) {
    const bt = await UC.validateBoardingTypeByName(req.query.boarding_type);

    stuQuery.boarding_type = bt;
  }

  if (req.query.student_status) {
    const status = req.query.student_status.toLowerCase();

    if (status !== "n" || status !== "o") {
      res.status(400);
      throw new Error(`student_status values can only be 'n' or 'o'`);
    }

    stuQuery.student_status = status;
  }

  const students = await Student.find(stuQuery)
    .select("name admission_no")
    .populate("class section stream boarding_type", "name")
    .populate("bus_stop", "name monthly_charges")
    .lean();

  const result = [];

  const terms = await FeeTerm.find({ academic_year: req.ayear })
    .select("name")
    .lean();

  for (const stu of students) {
    const fees = await FEE.calcStudentFees(stu.admission_no, req.ayear);

    const paidFees = FEE.combineFeesArrays(
      fees.paid_fees.one_time_fees,
      fees.paid_fees.term_fees,
      fees.paid_fees.partial_fees
    );

    const feeRow = {
      NAME: stu.name,
      CLASS:
        stu.class.name +
        (stu.stream.name === "NA" ? "" : ` ${stu.stream.name}`),
      BOARDING_TYPE: stu.boarding_type.name,
      ADMISSION_NO: stu.admission_no,
      ANNUAL_FEES: 0,
      ONE_TIME_FEES: 0,
    };

    for (const term of terms) {
      const termName = `TERM_FEES: ${term.name}`;
      feeRow[termName] = 0;
    }

    feeRow.TOTAL_PAID = fees.total_paid_amount;
    feeRow.TOTAL_UNPAID = fees.total_due_amount;
    feeRow.TOTAL_CONCESSION = fees.total_concession;
    feeRow.TOTAL_FINE = fees.total_fine;
    feeRow.TOTAL_AMOUNT = fees.total_amount;

    for (const paidFee of paidFees) {
      if (feeRow[paidFee.fee_term] === 0) {
        feeRow[paidFee.fee_term] = paidFee.term_due;
      } else if (paidFee.fee_term.includes("PARTIAL_FEES")) {
        feeRow.ANNUAL_FEES += paidFee.term_due;
      }
    }

    result.push(feeRow);
    // result.push(paidFees);
  }

  const fileName = `Fee_Report_${Date.now()}.xlsx`;
  const filePath = path.join("data", "excels", fileName);

  UC.jsonToExcel(
    filePath,
    result.sort((a, b) => {
      if (a.ADMISSION_NO > b.ADMISSION_NO) return 1;
      if (a.ADMISSION_NO < b.ADMISSION_NO) return -1;
      return 0;
    })
  );

  res.status(200).json({ file: `${process.env.DOMAIN}/excels/${fileName}` });
});

// @desc    Calculate fees
// @route   POST /api/fee/calculate
// @access  Private
const calculateFees = asyncHandler(async (req, res) => {
  if (!req.body.adm_no) {
    res.status(400);
    throw new Error(C.getFieldIsReq("adm_no"));
  }

  const admNo = req.body.adm_no.toUpperCase();

  const result = await FEE.calcStudentFees(admNo, req.ayear);

  // return res.json(result);

  const dueFees = FEE.combineFeesArrays(
    result.one_time_fees,
    result.term_fees,
    result.partial_fees
  );

  const paidFees = FEE.combineFeesArrays(
    result.paid_fees?.one_time_fees,
    result.paid_fees?.term_fees,
    result.paid_fees?.partial_fees
  );

  delete result.one_time_fees;
  delete result.term_fees;
  delete result.partial_fees;
  delete result.paid_fees;

  result.due_fees = dueFees;
  result.paid_fees = paidFees;

  res.status(200).json(result);
});

// @desc    Pay Term Fees
// @route   POST /api/fee/collect-fee
// @access  Private
const collectFee = asyncHandler(async (req, res) => {
  if (!req.body.adm_no) {
    res.status(400);
    throw new Error(C.getFieldIsReq("adm_no"));
  }

  const admNo = req.body.adm_no.toUpperCase();

  if (!req.body.fees || !req.body.fees.length) {
    res.status(400);
    throw new Error(C.getFieldIsReq("fees"));
  }

  const [oneTimeFees, termFees, partialFees] = FEE.splitFeesArrays(
    req.body.fees
  );

  const pm = req.body.payment_modes;

  if (!pm) {
    res.status(400);
    throw new Error(C.getFieldIsReq("payment_modes"));
  }

  const payModes = {
    cash: pm.cash ? parseFloat(pm.cash) : 0,
    online: {
      amount: pm.online?.amount ? parseFloat(pm.online.amount) : 0,
      transaction_id: pm.online?.transaction_id,
      bank: pm.online?.bank,
    },
    cheque_or_dd: {
      amount: pm.cheque_or_dd?.amount ? parseFloat(pm.cheque_or_dd.amount) : 0,
      transaction_id: pm.cheque_or_dd?.transaction_id,
      bank: pm.cheque_or_dd?.bank,
    },
    pos_machine: {
      amount: pm.pos_machine?.amount ? parseFloat(pm.pos_machine.amount) : 0,
      transaction_id: pm.pos_machine?.transaction_id,
      bank: pm.pos_machine?.bank,
    },
  };

  let totalAmount = 0;
  if (payModes.cash) {
    totalAmount += payModes.cash;
  }

  if (payModes.online.amount) {
    if (!payModes.online.transaction_id) {
      res.status(400);
      throw new Error(C.getFieldIsReq("payment_modes.online.transaction_id"));
    }

    if (!payModes.online.bank) {
      res.status(400);
      throw new Error(C.getFieldIsReq("payment_modes.online.bank"));
    }

    totalAmount += payModes.online.amount;
  }

  if (payModes.cheque_or_dd.amount) {
    if (!payModes.cheque_or_dd.transaction_id) {
      res.status(400);
      throw new Error(
        C.getFieldIsReq("payment_modes.cheque_or_dd.transaction_id")
      );
    }

    if (!payModes.cheque_or_dd.bank) {
      res.status(400);
      throw new Error(C.getFieldIsReq("payment_modes.cheque_or_dd.bank"));
    }

    totalAmount += payModes.cheque_or_dd.amount;
  }

  if (payModes.pos_machine.amount) {
    if (!payModes.pos_machine.transaction_id) {
      res.status(400);
      throw new Error(
        C.getFieldIsReq("payment_modes.pos_machine.transaction_id")
      );
    }

    if (!payModes.pos_machine.bank) {
      res.status(400);
      throw new Error(C.getFieldIsReq("payment_modes.pos_machine.bank"));
    }

    totalAmount += payModes.pos_machine.amount;
  }

  const fees = await FEE.getStudentFees(
    admNo,
    req.ayear,
    termFees,
    partialFees,
    oneTimeFees
  );

  if (totalAmount !== fees.total_due_amount) {
    res.status(400);
    throw new Error(
      `Amount should be: ${fees.total_due_amount}, instead got: ${totalAmount}.`
    );
  }

  const manualFeePayment = await ManualFeePayment.create({
    student: fees.student._id,
    payment_modes: payModes,
    paid_for: req.body.fees,
    total_amount: totalAmount,
    academic_year: req.ayear,
    collected_by: req.user._id,
  });

  if (
    await FeePaid.any({ student: fees.student._id, academic_year: req.ayear })
  ) {
    await FeePaid.updateOne(
      { student: fees.student._id, academic_year: req.ayear },
      {
        $push: {
          manual_fee_payments: manualFeePayment._id,
          one_time_fees: fees.one_time_fees,
          term_fees: fees.term_fees,
          partial_fees: fees.partial_fees,
        },
        $inc: {
          total_amount: fees.total_amount,
          total_concession: fees.total_concession,
          total_fine: fees.total_fine,
          total_due_amount: fees.total_due_amount,
        },
      }
    );
  } else {
    const feePaid = await FeePaid.create({
      student: fees.student._id,
      manual_fee_payments: [manualFeePayment._id],
      one_time_fees: fees.one_time_fees,
      term_fees: fees.term_fees,
      partial_fees: fees.partial_fees,
      total_amount: fees.total_amount,
      total_concession: fees.total_concession,
      total_fine: fees.total_fine,
      total_due_amount: fees.total_due_amount,
      academic_year: req.ayear,
    });
  }

  // Ledger
  const result = [];

  if (payModes.cash > 0) {
    const note = `STUDENT MANUAL FEE PAYMENT THROUGH CASH`;

    const ledger = await LEDGER.credit(
      C.CASH,
      payModes.cash,
      note,
      C.FEE_COLLECTION
    );

    result.push(ledger);
  }

  if (payModes.online.amount > 0) {
    const note = `STUDENT MANUAL FEE PAYMENT ONLINE: ${payModes.online.transaction_id}`;

    const ledger = await LEDGER.credit(
      C.ONLINE,
      payModes.online.amount,
      note,
      C.FEE_COLLECTION,
      payModes.online.bank
    );

    result.push(ledger);
  }

  if (payModes.cheque_or_dd.amount > 0) {
    const note = `STUDENT MANUAL FEE PAYMENT CHEQUE / DEMAND DRAFT: ${payModes.cheque_or_dd.transaction_id}`;

    const ledger = await LEDGER.credit(
      C.CHEQUE_OR_DD,
      payModes.cheque_or_dd.amount,
      note,
      C.FEE_COLLECTION,
      payModes.cheque_or_dd.bank
    );

    result.push(ledger);
  }

  if (payModes.pos_machine.amount > 0) {
    const note = `STUDENT MANUAL FEE PAYMENT POS MACHINE: ${payModes.pos_machine.transaction_id}`;

    const ledger = await LEDGER.credit(
      C.POS_MACHINE,
      payModes.pos_machine.amount,
      note,
      C.FEE_COLLECTION,
      payModes.pos_machine.bank
    );

    result.push(ledger);
  }

  res.status(200).json(result);
});

// @desc    Calculate student fee using admission_no
// @route   POST /api/fee-direct/calculate
// @access  Private
const feeDirectCalculate = asyncHandler(async (req, res) => {
  const school = await School.findOne().lean();

  req.school = school;
  req.ayear = school.current_academic_year;

  if (!req.body.adm_no) {
    res.status(400);
    throw new Error(C.getFieldIsReq("adm_no"));
  }

  const admNo = req.body.adm_no.toUpperCase();

  const result = await FEE.calcStudentFees(admNo, req.ayear);

  const dueFees = FEE.combineFeesArrays(
    result.one_time_fees,
    result.term_fees,
    result.partial_fees
  );

  const paidFees = FEE.combineFeesArrays(
    result.paid_fees?.one_time_fees,
    result.paid_fees?.term_fees,
    result.paid_fees?.partial_fees
  );

  delete result.one_time_fees;
  delete result.term_fees;
  delete result.partial_fees;
  delete result.paid_fees;

  result.due_fees = dueFees;
  result.paid_fees = paidFees;

  return res.status(200).json(result);
});

// @desc    Pay student fee using admission_no
// @route   POST /api/fee-direct/pay
// @access  Private
const feeDirectPayment = asyncHandler(async (req, res) => {
  const school = await School.findOne().lean();

  req.school = school;
  req.ayear = school.current_academic_year;

  if (!req.body.adm_no) {
    res.status(400);
    throw new Error(C.getFieldIsReq("adm_no"));
  }

  const admNo = req.body.adm_no.toUpperCase();

  const fee_terms = req.body.fee_terms;
  if (!fee_terms || fee_terms.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("fee_terms"));
  }

  if (req.body.amount === undefined) {
    res.status(400);
    throw new Error(C.getFieldIsReq("amount"));
  }

  const amount = parseInt(req.body.amount);

  if (isNaN(amount)) {
    res.status(400);
    throw new Error(C.getFieldIsInvalid("amount"));
  }

  const result = await FEE.getTermsFees(fee_terms, admNo, req.ayear);

  const terms_summary = result.terms.map((ele) => ({
    fee_term: ele.term._id,
    fee_types: ele.fee_types.map((ft) => ({
      fee_type: ft.fee_type._id,
      amount: ft.amount,
    })),
    amount: ele.amount,
    concession: ele.concession,
    fine: ele.fine,
    final_amount: ele.final_amount,
  }));

  // return res.json(terms_summary);

  if (amount !== result.total_due_amount) {
    res.status(400);
    throw new Error(
      `Amount should be: ${result.total_due_amount}, instead got: ${amount}.`
    );
  }

  // Initiate payment
  const student = result.student;
  const orderName = `${req.school.name}: student fee payment`;
  const orderDesc = `Student: ${student.name} fee payment`;
  const order = await createStudentFeeOrder(
    orderName,
    orderDesc,
    student,
    amount
  );

  const rpPayment = await RazorpayFeePayment.create({
    order,
    student: student._id,
    terms_summary,
    total_amount: result.total_amount,
    total_concession: result.total_concession,
    total_fine: result.total_fine,
    total_due_amount: result.total_due_amount,
  });

  res.status(200).json(order);
});

module.exports = {
  // getFeeGroups,
  // getFeeGroup,
  // addFeeGroup,
  // updateFeeGroup,
  // deleteFeeGroup,

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
  deleteFeeStructure,

  getFeeFines,
  getFeeFine,
  addFeeFine,
  deleteFeeFine,

  getFeeConcessions,
  getFeeConcession,
  addFeeConcession,
  deleteFeeConcession,

  getStudentFines,
  getStudentFine,
  addStudentFine,
  updateStudentFine,
  deleteStudentFine,

  getStudentWaivers,
  getStudentWaiver,
  addStudentWaiver,
  updateStudentWaiver,
  deleteStudentWaiver,

  getFeePayments,
  getDueFees,
  getFeeReport,
  calculateFees,
  collectFee,

  feeDirectCalculate,
  feeDirectPayment,
};
