const fs = require("node:fs");
const path = require("node:path");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const User = require("../models/system/userModel");
const Designation = require("../models/hr/designationModel");
const Department = require("../models/hr/departmentModel");
const Staff = require("../models/hr/staffModels");
const StaffAttendance = require("../models/hr/staffAttendanceModel");

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
    query["$or"] = searchQuery["$or"];
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
    query["$or"] = searchQuery["$or"];
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
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(Staff, query, {}, page, limit, sort);

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a staff
// @route   GET /api/hr/staff/:id
// @access  Private
const getStaff = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const staff = await Staff.findOne(query).populate("school", "name").lean();

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
  if (!req.body.name) {
    res.status(400);
    throw new Error(C.getFieldIsReq("name"));
  }
  if (!req.body.email) {
    res.status(400);
    throw new Error(C.getFieldIsReq("email"));
  }
  if (!req.body.gender) {
    res.status(400);
    throw new Error(C.getFieldIsReq("gender"));
  }
  if (!req.body.department) {
    res.status(400);
    throw new Error(C.getFieldIsReq("department"));
  }
  const dpt = await Department.find({ name: req.body.department.toUpperCase() })
    .select("_id")
    .lean();
  if (!dpt) {
    res.status(400);
    throw new Error(C.getResourse404Id("department", req.body.department));
  }
  if (!req.body.designation) {
    res.status(400);
    throw new Error(C.getFieldIsReq("designation"));
  }
  const dsg = await Department.find({
    name: req.body.designation.toUpperCase(),
  })
    .select("_id")
    .lean();
  if (!dsg) {
    res.status(400);
    throw new Error(C.getResourse404Id("designation", req.body.designation));
  }
  if (!req.body.staff_id) {
    res.status(400);
    throw new Error(C.getFieldIsReq("staff_id"));
  }
  if (!req.body.staff_type) {
    res.status(400);
    throw new Error(C.getFieldIsReq("staff_type"));
  }
  if (!req.body.rfid) {
    res.status(400);
    throw new Error(C.getFieldIsReq("rfid"));
  }
  if (!req.body.nationality) {
    res.status(400);
    throw new Error(C.getFieldIsReq("nationality"));
  }
  const signFile = req.files.sign;
  const sign = signFile ? signFile[0].filename : "";

  const photoFile = req.files.photo;
  const photo = photoFile ? photoFile[0].filename : "";
  const Address = {
    street: req.body.street,
    state: req.body.state,
    pin: req.body.pin,
    city: req.body.city,
    country: req.body.country,
  };
  const Family = {
    father_name: req.body.father_name,
    mother_name: req.body.mother_name,
    spouse_name: req.body.spouse_name,
    father_profession: req.body.father_profession,
    spouse_profession: req.body.spouse_profession,
    mother_profession: req.body.mother_profession,
    father_contact: req.body.father_contact,
    mother_contact: req.body.mother_contact,
    spouse_contact: req.body.spouse_contact,
  };

  const staff = await Staff.create({
    role: req.body.role,
    saluation: req.body.saluation,
    sign,
    name: req.body.name,
    email: req.body.email,
    mobile: req.body.mobile,
    designation: dsg._id,
    name: req.body.name,
    biometric: req.body.biometric,
    date_of_regular: req.body.date_of_regular,
    marital_status: req.body.marital_status,
    sequence_no: req.body.sequence_no,
    reporting_authority: req.body.reporting_authority,
    birth_date: req.body.birth_date,
    joining_date: req.body.joining_date,
    gender: req.body.gender,
    department: dpt._id,
    incharge: req.body.incharge,
    photo,
    staff_id: req.body.staff_id,
    staff_type: req.body.staff_type,
    rfid: req.body.rfid,
    wing: req.body.wing,
    confirmation_date: req.body.confirmation_date,
    intercommunication: req.body.intercommunication,
    religion: req.body.religion,
    blood_group: req.body.blood_group,
    service_end_date: req.body.service_end_date,
    class_interchange: req.body.class_interchange,
    Address,
    Family,
    nationality: req.body.nationality,
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
    if (!(await Designation.any({ _id: designation, manager, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("designation", designation));
    }
  }

  // Validate Department
  if (department) {
    if (!(await Department.any({ _id: department, manager, school }))) {
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
      photo: photo,
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

  const staff = await Staff.findOne(query)
    .select("photo joining_letter resume other_document")
    .lean();

  if (staff.photo !== "") {
    fs.unlinkSync(
      path.join(UC.getAppRootDir(__dirname), "uploads", "staff", staff.photo)
    );
  }

  if (staff.joining_letter !== "") {
    fs.unlinkSync(
      path.join(
        UC.getAppRootDir(__dirname),
        "uploads",
        "staff",
        staff.joining_letter
      )
    );
  }

  if (staff.resume !== "") {
    fs.unlinkSync(
      path.join(UC.getAppRootDir(__dirname), "uploads", "staff", staff.resume)
    );
  }

  if (staff.other_document !== "") {
    fs.unlinkSync(
      path.join(
        UC.getAppRootDir(__dirname),
        "uploads",
        "staff",
        staff.other_document
      )
    );
  }

  const result = await Staff.deleteOne(query);

  res.status(200).json(result);
});

//  4. Attendance

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
};
