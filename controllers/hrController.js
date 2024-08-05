const fs = require("node:fs");
const path = require("node:path");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const User = require("../models/system/userModel");
const Designation = require("../models/hr/designationModel");
const Department = require("../models/hr/departmentModel");
const Staff = require("../models/hr/staffModel");
const StaffAttendance = require("../models/hr/staffAttendanceModel");
const Shift = require("../models/hr/shiftModel");
const uploadPaths = require("../config/uploadPaths");
const ShiftPlan = require("../models/hr/shiftPlanModel");
const ShiftRule = require("../models/hr/shiftPlanRuleModel");

const { DOMAIN } = process.env;

/** 1. Designation */

// @desc    Get all designations
// @route   GET /api/hr/designation
// @access  Private
const getDesignations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "title";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["title"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    Designation,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a designation
// @route   GET /api/hr/designation/:id
// @access  Private
const getDesignation = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const designation = await Designation.findOne(query)
    .populate("school", "name")
    .lean();

  if (!designation) {
    res.status(404);
    throw new Error(C.getResourse404Id("Designation", req.params.id));
  }

  res.status(200).json(designation);
});

// @desc    Add a designation
// @route   POST /api/hr/designation
// @access  Private
const addDesignation = asyncHandler(async (req, res) => {
  const designation = await Designation.create({
    title: req.body.title,
    school: req.school,
  });

  res.status(201).json({ msg: designation._id });
});

// @desc    Update a designation
// @route   PUT /api/hr/designation/:id
// @access  Private
const updateDesignation = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const designation = await Designation.findOne(query).select("_id").lean();

  if (!designation) {
    res.status(404);
    throw new Error(C.getResourse404Id("Designation", req.params.id));
  }

  const result = await Designation.updateOne(query, {
    $set: { title: req.body.title },
  });

  res.status(200).json(result);
});

// @desc    Delete a designation
// @route   DELETE /api/hr/designation/:id
// @access  Private
const deleteDesignation = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const desig = await Designation.findOne(query).select("_id").lean();

  if (!desig) {
    res.status(400);
    throw new Error(C.getResourse404Id("Designation", req.params.id));
  }

  if (await Staff.any({ designation: desig._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("Designation", "Staff"));
  }

  const result = await Designation.deleteOne(query);

  res.status(200).json(result);
});

/** 2. Department */

// @desc    Get all departments
// @route   GET /api/hr/department
// @access  Private
const getDepartments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    Department,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a department
// @route   GET /api/hr/department/:id
// @access  Private
const getDepartment = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const department = await Department.findOne(query)
    .populate("school", "name")
    .lean();

  if (!department) {
    res.status(404);
    throw new Error(C.getResourse404Id("Department", req.params.id));
  }

  res.status(200).json(department);
});

// @desc    Add a department
// @route   POST /api/hr/department
// @access  Private
const addDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create({
    name: req.body.name,
    school: req.school,
  });

  res.status(201).json({ msg: department._id });
});

// @desc    Update a department
// @route   PUT /api/hr/department/:id
// @access  Private
const updateDepartment = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const department = await Department.findOne(query).select("_id").lean();

  if (!department) {
    res.status(404);
    throw new Error(C.getResourse404Id("Department", req.params.id));
  }

  const result = await Department.updateOne(query, {
    $set: { name: req.body.name },
  });

  res.status(200).json(result);
});

// @desc    Delete a department
// @route   DELETE /api/hr/department/:id
// @access  Private
const deleteDepartment = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const dept = await Department.findOne(query).select("_id").lean();

  if (!dept) {
    res.status(400);
    throw new Error(C.getResourse404Id("Department", req.params.id));
  }

  if (await Staff.any({ designation: dept._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("Department", "Staff"));
  }

  const result = await Department.deleteOne(query);

  res.status(200).json(result);
});

/** 3. Staff */

// @desc    Get all staffs
// @route   GET /api/hr/staff
// @access  Private
const getStaffs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(Staff, query, {}, page, limit, sort);

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  const url = `${DOMAIN}/uploads/staff`;

  for (const data of results.result) {
    data.photo = `${url}/${data.photo}`;
    data.resume = `${url}/${data.resume}`;
    data.joining = `${url}/${data.joining}`;
  }

  res.status(200).json(results);
});

// @desc    Get a staff
// @route   GET /api/hr/staff/:id
// @access  Private
const getStaff = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const staff = await Staff.findOne(query).populate("name").lean();

  if (!staff) {
    res.status(404);
    throw new Error(C.getResourse404Id("Staff", req.params.id));
  }

  res.status(200).json(staff);
});

// @desc    Add a staff
// @route   POST /api/hr/staff
// @access  Private
const addStaff = asyncHandler(async (req, res) => {
  const role = await UC.getRoleId(req.body.role);
  const dept = await UC.validateDepartmentByName(req.body.department);
  const desg = await UC.validateDesignationByName(req.body.designation);

  const photoFile = req.files.photo;
  const photo = photoFile ? photoFile[0].filename : "";

  const resumeFile = req.files.resume;
  const resume = resumeFile ? resumeFile[0].filename : "";

  const joiningLetterFile = req.files.joining;
  const joiningLetter = joiningLetterFile ? joiningLetterFile[0].filename : "";

  const otherDocumentFile = req.files.other;
  const otherDocument = otherDocumentFile ? otherDocumentFile[0].filename : "";

  const staff = await Staff.create({
    staff_no: req.body.staff_no,
    role,
    department: dept,
    designation: desg,
    name: {
      first: req.body.f_name,
      last: req.body.l_name,
    },
    father_name: req.body.fath_name,
    mother_name: req.body.moth_name,
    email: req.body.email,
    gender: req.body.gender,
    dob: req.body.dob,
    doj: req.body.doj,
    mobile: {
      primary: req.body.primary,
      secondary: req.body.secondary,
    },
    marital_status: req.body.marital_status,
    driving_license: req.body.driving_license,
    photo,
    expert_staff: req.body.expert_staff,
    per_address: {
      street: req.body.street,
      city: req.body.city,
      pin: req.body.pin,
      state: req.body.state,
      country: req.body.country,
    },
    cur_address: {
      street: req.body.street,
      city: req.body.city,
      pin: req.body.pin,
      state: req.body.state,
      country: req.body.country,
    },
    qualification: req.body.qualification,
    experience: req.body.experience,
    payroll_details: {
      epf_no: req.body.epf_no,
      b_salary: req.body.b_salary,
      contract: req.body.contract,
    },
    bank_info_details: {
      account_name: req.body.account_name,
      account_no: req.body.account_no,
      bank_name: req.body.bank_name,
      branch_name: req.body.branch_name,
    },
    social_details: {
      facebook: req.body.facebook,
      twitter: req.body.twitter,
      linkedin: req.body.linkedin,
      instagram: req.body.instagram,
    },
    document_info: {
      resume,
      joiningLetter,
      otherDocument,
    },
  });
  res.status(200).json({ msg: staff._id });
});

// @desc    Update a staff
// @route   PUT /api/hr/staff/:id
// @access  Private
const updateStaff = asyncHandler(async (req, res) => {
  const designation = req.body.designation;
  const department = req.body.department;

  const query = { _id: req.params.id };

  const staff = await Staff.findOne(query).select("_id").lean();

  if (!staff) {
    res.status(404);
    throw new Error(C.getResourse404Id("Staff", req.params.id));
  }

  // Validate Designation
  if (designation) {
    if (!(await Designation.any({ _id: designation }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("designation", designation));
    }
  }

  // Validate Department
  if (department) {
    if (!(await Department.any({ _id: department }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("department", department));
    }
  }

  const result = await Staff.updateOne(query, {
    $set: {
      role: req.body.role,
      name: req.body.name,
      father_name: req.body.father_name,
      mother_name: req.body.mother_name,
      dob: req.body.dob,
      doj: req.body.doj,
      email: req.body.email,
      gender: req.body.gender,
      mobile: req.body.mobile,
      emergency_mobile: req.body.emergency_mobile,
      marital_status: req.body.marital_status,
      // photo: req.files.photo,
      address: req.body.address,
      qualification: req.body.qualification,
      experience: req.body.experience,
      epf_no: req.body.epf_no,
      basic_salary: req.body.basic_salary,
      contract_type: req.body.contract_type,
      location: req.body.location,
      casual_leave: req.body.casual_leave,
      medical_leave: req.body.medical_leave,
      metarnity_leave: req.body.metarnity_leave,
      bank: req.body.bank,
      url: req.body.url,
      joining_letter: req.body.joining_letter,
      resume: req.body.resume,
      other_document: req.body.other_document,
      notes: req.body.notes,
      driving_license: req.body.driving_license,
      driving_license_ex_date: req.body.driving_license_ex_date,
      department,
      designation,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a staff
// @route   DELETE /api/hr/staff/:id
// @access  Private
const deleteStaff = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const staff = await Staff.findOne(query).select("photo").lean();

  const photoPath = path.join(uploadPaths.staff, staff.photo);
  if (staff.photo !== "" && fs.existsSync(photoPath)) {
    fs.unlinkSync(photoPath);
  }

  const result = await Staff.deleteOne(query);

  res.status(200).json(result);
});

/** 2. Department */

// @desc    post attendance
// @route   POST  /api/hr/attendance
// @access  Private

const addHrAttendance = asyncHandler(async (req, res) => {
  if (!req.body.role) {
    res.status(400);
    throw new Error(C.FIELD_IS_REQ("role"));
  }

  const r = Staff.find({ role: req.body.role.toUpperCase() })
    .select("_id")
    .lean();

  if (!r) {
    res.status(400);
    throw new Error("role", req.body.role);
  }

  if (!(await req.body.attendance_date)) {
    res.status(400);
    throw new Error(C.FIELD_IS_REQ("attendance_date"));
  }

  // const attendance = await StaffAttendance.create({
  //       role: r._id,
  //       date: req.body.attendance_date,
  //       mark_holiday:req.body.mark_holiday,

  // }
  // )
});

/** 2. Shift */

// @desc    Get shifts
// @route   GET /api/hr/shift
// @access  Private
const getShifts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort;
  const search = req.query.search;
  const query = {};

  if (search) {
    const fields = ["name"];
    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }
  const results = UC.paginatedQuery({
    Shift,
    query,
    page,
    limit,
    sort,
  });
  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  res.status(200).json(results);
});

// @desc    Get shift
// @route   GET /api/hr/shift/:id
// @access  Private
const getShift = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  const shift = await Shift.find(query);

  if (!shift) {
    res.status(400);
    throw new Error(C.getResourse404Id("shift", req.params.id));
  }
  res.status(200).json(shift);
});

// @desc    Add shift
// @route   POST /api/hr/shift
// @access  Private
const addShift = asyncHandler(async (req, res) => {
  const shiftData = { name: req.body.name, type: req.body.type };

  if (shiftData.type === C.FIXED) {
    if (!req.body.clock_in_time) {
      res.status(400);
      throw new Error(C.getFieldIsReq("start_time"));
    }

    if (!req.body.clock_out_time) {
      res.status(400);
      throw new Error(C.getFieldIsReq("end_time"));
    }

    if (!req.body.grace_period) req.body.grace_period = C.NO;

    shiftData.fixed = {
      clock_in_time: req.body.clock_in_time,
      clock_out_time: req.body.clock_out_time,
      no_of_hours:req.body.no_of_hours,
      overtime_allowed: req.body.overtime_allowed,
      grace_period: req.body.grace_period,
    };

    if (shiftData.fixed.grace_period === C.YES) {
      if (!req.body.after_shift_start) {
        res.status(400);
        throw new Error(C.getFieldIsReq("after_shift_start"));
      }

      shiftData.fixed.after_shift_start = req.body.after_shift_start;

      if (!req.body.before_shift_ends) {
        res.status(400);
        throw new Error(C.getFieldIsReq("before_shift_ends"));
      }

      shiftData.fixed.before_shift_ends = req.body.before_shift_ends;
    }

    // Calculate duration
    const duration = await  UC.getDifferenceBetweenHours(
      shiftData.fixed.clock_out_time,
      shiftData.fixed.clock_in_time
    );

    shiftData.duration = duration;
  } else if (shiftData.type === C.FLEXIBLE) {
    if (!req.body.core_hours) {
      res.status(400);
      throw new Error(C.getFieldIsReq("core_hours"));
    }

    shiftData.flexible = { core_hours: req.body.core_hours };

    if (shiftData.flexible.core_hours === C.YES) {
      if (!req.body.core_start_time) {
        res.status(400);
        throw new Error(C.getFieldIsReq("core_start_time"));
      }
      if (!req.body.core_end_time) {
        res.status(400);
        throw new Error(C.getFieldIsReq("core_end_time"));
      }

      shiftData.flexible.core_start_time = req.body.core_start_time;
      shiftData.flexible.core_end_time = req.body.core_end_time;
    }

    shiftData.duration = req.body.duration;
  } else {
    res.status(400);
    throw new Error(C.getValueNotSup(shiftData.type));
  }

  shiftData.full_day_min_hours = req.body.full_day_min_hours;
  shiftData.half_day_min_hours = req.body.half_day_min_hours;
  shiftData.mode = req.body.mode;

  const durationMinutes = UC.convertHHMMToMinutes(shiftData.duration);
  const fdmhMinutes = UC.convertHHMMToMinutes(shiftData.full_day_min_hours);
  const hdmhMinutes = UC.convertHHMMToMinutes(shiftData.half_day_min_hours);

  if (durationMinutes < fdmhMinutes) {
    res.status(400);
    throw new Error(`full_day_min_hours should be less than duration`);
  }

  if (durationMinutes < hdmhMinutes) {
    res.status(400);
    throw new Error(`half_day_min_hours should be less than duration`);
  }

  if (fdmhMinutes <= hdmhMinutes) {
    res.status(400);
    throw new Error(
      `half_day_min_hours should be less than full_day_min_hours`
    );
  }

  const shift = await Shift.create(shiftData);

  res.status(200).json({ msg: shift._id });
});

// @desc update  shift
// @route PATCH /api/hr/shift/:id
// @access  Private
const updateShift = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (!(await Shift.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Id("shift", req.params.id));
  }
  const updatedShift = await Shift.updateOne(query, {
    $set: {
      name: req.body.name,
      type: req.body.type,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      duration: req.body.duration,
      grace_period: req.body.grace_period,
      after_shift_start: req.body.after_shift_start,
      before_shift_ends: req.body.before_shift_ends,
      core_hours: req.body.core_hours,
      core_start_time: req.body.core_start_time,
      core_end_time: req.body.core_end_time,
      fullDay_minHour: req.body.fullDay_minHour,
      halfDay_minHour: req.body.halfDay_minHour,
      mode: req.body.mode,
    },
  });
  res.status(200).json(updatedShift);
});

// @desc delete hr shift
// @route DELETE /api/hr/shift/:id
// @access Private

const deleteShift = asyncHandler(async (req, res) => {
  const hrShift = await Shift.findById(req.params.id).select("_id").lean();
  if (!hrShift) {
    res.status(400);
    throw new Error(C.getResourse404Id("hrShift", req.params.id));
  }
  const delQuery = { _id: req.params.id };
  const result = await Shift.deleteOne(delQuery);

  res.status(200).json(result);
});

// @desc   get shift plan rules
// @route  GET /api/hr/shift-rule
// @access  Private
const getShiftsRules = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort;
  const search = req.query.search;
  const query = {};

  if (search) {
    const fields = ["staff"];
    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }
  const results = await UC.paginatedQuery({
    ShiftRule,
    query,
    page,
    limit,
    sort,
  });
  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  res.status(200).json(results);
});

// @desc   get shift plan rule
// @route  GET /api/hr/shift-rule/:id
// @access  Private
const getShiftRule = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  const shiftRule = await ShiftRule.find(query);

  if (!shiftRule) {
    res.status(400);
    throw new Error(C.getResourse404Id("shiftRule", req.params.id));
  }
  res.status(200).json(shiftRule);
});

// @desc   add shift plan rule
// @route  POST /api/hr/shift-rule
// @access Private
const addShiftRule = asyncHandler(async (req, res) => {
    const shift = await UC.validateShiftByName(req.body.shift.name,req.body.shift.type);

  const shiftRuleData = {
    shift:shift._id,
    clock_in_time_valid: req.body.clock_in_time_valid,
    clock_out_early_time: req.body.clock_out_early_time,
    late_allow: req.body.late_allow,
    early_leave_allow: req.body.early_leave_allow,
    overtime: req.body.overtime,
    is_clock_in: req.body.is_clock_in,
    is_clock_out: req.body.is_clock_out,
    weekend: req.body.weekend,
  }
  if(shift.type === C.FIXED){
    shiftRuleData.overtime = UC.calculateOverTime(shift);
  }
  const shiftRule = await ShiftRule.create(shiftRuleData);
  res.status(200).json(shiftRule);
  
});

// @desc update  shift rule
// @route PATCH  /api/hr/shift/:id
// @access  Private
const updateShiftRule = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (!(await ShiftRule.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Id("shiftRule", req.params.id));
  }
  const updatedShiftRule = await ShiftRule.updateOne(query, {
    $set: {
      clock_in_time_valid: req.body.clock_in_time_valid,
      clock_out_early_time: req.body.clock_out_early_time,
      late_allow: req.body.late_allow,
      early_leave_allow: req.body.early_leave_allow,
      overtime: req.body.overtime,
      is_clock_in: req.body.is_clock_in,
      is_clock_out: req.body.is_clock_out,
      weekend: req.body.weekend,
    },
  });
  res.status(200).json(updatedShiftRule);
});

// @desc delete hr shift-rule
// @route DELETE /api/hr/shift-rule/:id
// @access Private

const deleteShiftRule = asyncHandler(async (req, res) => {
  const shiftRule = await ShiftRule.findById(req.params.id)
    .select("_id")
    .lean();
  if (!shiftRule) {
    res.status(400);
    throw new Error(C.getResourse404Id("shiftRule", req.params.id));
  }
  const delQuery = { _id: req.params.id };
  const result = await ShiftRule.deleteOne(delQuery);

  res.status(200).json(result);
});

// @desc add shift plan
// @route /api/hr/shift-plan/
// @access secured

// const addShiftPlan = asyncHandler(async (req, res) => {
//   if (!req.body.shift) {
//     res.status(400);
//     throw new Error(C.FIELD_IS_REQ("shift"));
//   }
//   const sh = await Shift.find({ _id: req.body.shift })

//   if (!sh) {
//     res.status(400);
//     throw new Error(C.FIELD_IS_REQ("shift"));
//   }
//   const shiftPlan = await ShiftPlan.create({
//     shift: req.body.shift,
//     effective_from: req.body.effective_from,
//     repeat: req.body.repeat,
//     choose_oneShift_from_multipleShift:
//     req.body.choose_oneShift_from_multipleShift,
//     status: req.body.status,

//   });
//   res.status(200).json(shiftPlan._id);
// });

// // @desc    Get shiftPlans
// // @route   GET /api/hr/shift-plan
// // @access  Private
// const getShiftPlans = asyncHandler(async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.rows) || 10;
//   const sort = req.query.sort || "class";
//   const search = req.query.search;

//   const query = {};

//   if (search) {
//     const fields = ["shift"];

//     const searchQuery = UC.createSearchQuery(fields, search);
//     query["$or"] = searchQuery["$or"];
//   }

//   const results = await UC.paginatedQuery({
//     ShiftPlan,
//     query,
//     page,
//     limit,
//     sort,
//     // ["shift","name"]
//   });
//   if (!results) {
//     res.status(400).json({ msg: C.PAGE_LIMIT_REACHED });
//   }
//   res.status(200).json(results);
// });

// // @desc   get ShiftPlan
// // @route  GET /api/hr/shift-plan/:id
// // @access  Private
// const getShiftPlan = asyncHandler(async (req, res) => {
//   const query = { _id: req.params.id };
//   const shiftPlan = await ShiftPlan.find(query);

//   if (!shiftPlan) {
//     res.status(400);
//     throw new Error(C.getResourse404Id("shiftPlan", req.params.id));
//   }
//   res.status(200).json(shiftPlan);
// });

// // @desc update  shiftPlan
// // @route PATCH /api/hr/shift-plan/:id
// // @access  Private

module.exports = {
  getDesignations,
  getDesignation,
  addDesignation,
  updateDesignation,
  deleteDesignation,

  getDepartments,
  getDepartment,
  addDepartment,
  updateDepartment,
  deleteDepartment,

  getStaffs,
  getStaff,
  addStaff,
  updateStaff,
  deleteStaff,

  addHrAttendance,

  getShifts,
  getShift,
  addShift,
  updateShift,
  deleteShift,

  getShiftsRules,
  getShiftRule,
  addShiftRule,
  updateShiftRule,
  deleteShiftRule,

  //   getShiftPlans,
  //   getShiftPlan,
  //   addShiftPlan,
};
