const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const User = require("../models/system/userModel");
const Bus = require("../models/transport/busModel");
const BusStop = require("../models/transport/busStopModel");
const School = require("../models/system/schoolModel");
const BusStaff = require("../models/transport/busStaffModel");
const Class = require("../models/academics/classModel");
const Section = require("../models/academics/sectionModel");
const AcademicYear = require("../models/academics/academicYearModel");
const FeeGroup = require("../models/fees/feeGroupModel");
const StudentType = require("../models/studentInfo/studentTypeModel");
const FeeType = require("../models/fees/feeTypeModel");
const FeeTerm = require("../models/fees/feeTermModel");
const FeeHead = require("../models/fees/feeHeadModel");
const Designation = require("../models/hr/designationModel");
const Department = require("../models/hr/departmentModel");
const Student = require("../models/studentInfo/studentModel");

// @desc    Get managers
// @route   GET /api/util/manager-list
// @access  Private
const getManagerList = asyncHandler(async (req, res) => {
  const search = req.query.search;
  const managerList = [];

  if (!C.isAdmins(req.user.type)) return res.status(200).json(managerList);

  if (!search) {
    const managers = await User.find({ type: C.MANAGER })
      .select("email")
      .sort("email")
      .limit(20)
      .lean();

    managers.forEach((m) => managerList.push(m));

    return res.status(200).json(managerList);
  }

  const managers = await User.find({
    type: C.MANAGER,
    $or: [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ],
  })
    .select("email")
    .sort("email")
    .lean();

  managers.forEach((m) => managerList.push(m));

  res.status(200).json(managerList);
});

// @desc    Get schools
// @route   GET /api/util/school-list
// @access  Private
const getSchoolList = asyncHandler(async (req, res) => {
  const { search, form } = req.query;
  let manager = req.query.manager;
  const school = [];

  if (C.isManager(req.user.type)) {
    manager = req.user._id;
  }

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  const query = { type: C.SCHOOL, manager };
  const schoolQuery = { manager };

  const notUser = [];
  if (form === "school") {
    const schools = await School.find(schoolQuery).select("school").lean();

    schools.forEach((s) => notUser.push(s.school.toString()));
  }

  if (!search) {
    const users = await User.find(query)
      .select("name")
      .sort("name")
      .limit(20)
      .lean();

    users.forEach((u) => {
      if (!notUser.includes(u._id.toString())) school.push(u);
    });

    return res.status(200).json(school);
  }

  query["$or"] = [
    { email: { $regex: search, $options: "i" } },
    { name: { $regex: search, $options: "i" } },
  ];

  const users = await User.find(query).select("name").sort("name").lean();

  users.forEach((u) => {
    if (!notUser.includes(u._id)) school.push(u);
  });

  res.status(200).json(school);
});

// @desc    Get student-types
// @route   GET /api/util/student-type-list
// @access  Private
const getStudentTypeList = asyncHandler(async (req, res) => {
  let manager = req.query.manager;
  let school = req.query.school;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const types = await StudentType.find({ manager, school })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(types);
});

// @desc    Get bus-stop
// @route   GET /api/util/bus-stop-list
// @access  Private
const getBusStopList = asyncHandler(async (req, res) => {
  let manager = req.query.manager;
  let school = req.query.school;

  if (C.isManager(req.user.type)) {
    manager = req.user._id;
  } else if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  }

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const busStops = await BusStop.find({ manager, school })
    .select("name")
    .lean();

  res.status(200).json(busStops);
});

// @desc    Get drivers
// @route   GET /api/util/driver-list
// @access  Private
const getDriverList = asyncHandler(async (req, res) => {
  const { search, form } = req.query;
  let manager = req.query.manager;
  let school = req.query.school;
  const driver = [];

  if (C.isManager(req.user.type)) {
    manager = req.user._id;
  } else if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  }

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const query = { type: "d", manager, school };
  const busQuery = { manager, school };

  const notDriver = [];
  if (form === "bus") {
    const buses = await Bus.find(busQuery).select("driver").lean();

    buses.forEach((b) => notDriver.push(b.driver.toString()));
  }

  if (!search) {
    const busStaffs = await BusStaff.find(query)
      .select("name")
      .sort("name")
      .limit(20)
      .lean();

    busStaffs.forEach((u) => {
      if (!notDriver.includes(u._id.toString())) driver.push(u);
    });

    return res.status(200).json(driver);
  }

  query["$or"] = [
    { email: { $regex: search, $options: "i" } },
    { "name.f": { $regex: search, $options: "i" } },
    { "name.m": { $regex: search, $options: "i" } },
    { "name.l": { $regex: search, $options: "i" } },
  ];

  const drivers = await BusStaff.find(query).select("name").sort("name").lean();

  drivers.forEach((d) => {
    if (!notDriver.includes(d._id)) driver.push(d);
  });

  res.status(200).json(driver);
});

// @desc    Get conductors
// @route   GET /api/util/conductor-list
// @access  Private
const getConductorList = asyncHandler(async (req, res) => {
  const { search, form } = req.query;
  let manager = req.query.manager;
  let school = req.query.school;
  const conductor = [];

  if (C.isManager(req.user.type)) {
    manager = req.user._id;
  } else if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  }

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const query = { type: "c", manager, school };
  const busQuery = { manager, school };

  const notConductor = [];
  if (form === "bus") {
    const buses = await Bus.find(busQuery).select("conductor").lean();

    buses.forEach((b) => notConductor.push(b.conductor.toString()));
  }

  if (!search) {
    const busStaffs = await BusStaff.find(query)
      .select("name")
      .sort("name")
      .limit(20)
      .lean();

    busStaffs.forEach((c) => {
      if (!notConductor.includes(c._id.toString())) conductor.push(c);
    });

    return res.status(200).json(conductor);
  }

  query["$or"] = [
    { email: { $regex: search, $options: "i" } },
    { "name.f": { $regex: search, $options: "i" } },
    { "name.m": { $regex: search, $options: "i" } },
    { "name.l": { $regex: search, $options: "i" } },
  ];

  const drivers = await BusStaff.find(query).select("name").sort("name").lean();

  drivers.forEach((c) => {
    if (!notConductor.includes(c._id)) conductor.push(c);
  });

  res.status(200).json(conductor);
});

// @desc    Get buses
// @route   GET /api/util/bus-list
// @access  Private
const getBusList = asyncHandler(async (req, res) => {
  let manager = req.query.manager;
  let school = req.query.school;

  if (C.isManager(req.user.type)) {
    manager = req.user._id;
  } else if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  }

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const buses = await Bus.find({ manager, school }).select("name").lean();

  res.status(200).json(buses);
});

// @desc    Get academic year
// @route   GET /api/util/academic-year-list
// @access  Private
const getAcademicYearList = asyncHandler(async (req, res) => {
  let manager = req.query.manager;
  let school = req.query.school;

  if (C.isManager(req.user.type)) {
    manager = req.user._id;
  } else if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  }

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const years = await AcademicYear.find({ manager, school })
    .select("title")
    .lean();

  res.status(200).json(years);
});

// @desc    Get sections
// @route   GET /api/util/section-list
// @access  Private
const getSectionList = asyncHandler(async (req, res) => {
  let manager = req.query.manager;
  let school = req.query.school;
  const academic_year = req.query.ayear;

  if (C.isManager(req.user.type)) {
    manager = req.user._id;
  } else if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  }

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!academic_year) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ayear"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const sections = await Section.find({ manager, school, academic_year })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(sections);
});

// @desc    Get classes
// @route   GET /api/util/class-list
// @access  Private
const getClassList = asyncHandler(async (req, res) => {
  let manager = req.query.manager;
  let school = req.query.school;
  const academic_year = req.query.ayear;

  if (C.isManager(req.user.type)) {
    manager = req.user._id;
  } else if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  }

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!academic_year) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ayear"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const classes = await Class.find({ manager, school, academic_year })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(classes);
});

// @desc    Get fee-groups
// @route   GET /api/util/fee-group-list
// @access  Private
const getFeeGroupList = asyncHandler(async (req, res) => {
  let manager = req.query.manager;
  let school = req.query.school;
  const academic_year = req.query.ayear;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!academic_year) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ayear"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const groups = await FeeGroup.find({ manager, school, academic_year })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(groups);
});

// @desc    Get fee-types
// @route   GET /api/util/fee-type-list
// @access  Private
const getFeeTypeList = asyncHandler(async (req, res) => {
  let manager = req.query.manager;
  let school = req.query.school;
  const academic_year = req.query.ayear;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!academic_year) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ayear"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const types = await FeeType.find({ manager, school, academic_year })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(types);
});

// @desc    Get fee-terms
// @route   GET /api/util/fee-term-list
// @access  Private
const getFeeTermList = asyncHandler(async (req, res) => {
  let manager = req.query.manager;
  let school = req.query.school;
  const academic_year = req.query.ayear;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!academic_year) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ayear"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const terms = await FeeTerm.find({ manager, school, academic_year })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(terms);
});

// @desc    Get fee-heads
// @route   GET /api/util/fee-head-list
// @access  Private
const getFeeHeadList = asyncHandler(async (req, res) => {
  let manager = req.query.manager;
  let school = req.query.school;
  const academic_year = req.query.ayear;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!academic_year) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ayear"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const heads = await FeeHead.find({ manager, school, academic_year })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(heads);
});

// @desc    Get designations
// @route   GET /api/util/designation-list
// @access  Private
const getDesignationList = asyncHandler(async (req, res) => {
  let manager = req.query.manager;
  let school = req.query.school;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const designations = await Designation.find({ manager, school })
    .select("title")
    .sort("title")
    .lean();

  res.status(200).json(designations);
});

// @desc    Get departments
// @route   GET /api/util/department-list
// @access  Private
const getDepartmentList = asyncHandler(async (req, res) => {
  let manager = req.query.manager;
  let school = req.query.school;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const departments = await Department.find({ manager, school })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(departments);
});

module.exports = {
  getManagerList,
  getSchoolList,
  getStudentTypeList,
  getDriverList,
  getConductorList,
  getBusList,
  getBusStopList,
  getAcademicYearList,
  getClassList,
  getSectionList,
  getFeeGroupList,
  getFeeTypeList,
  getFeeTermList,
  getFeeHeadList,
  getDesignationList,
  getDepartmentList,
};
