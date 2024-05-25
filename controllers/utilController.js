const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Bus = require("../models/transport/busModel");
const BusStop = require("../models/transport/busStopModel");
const BusStaff = require("../models/transport/busStaffModel");
const Class = require("../models/academics/classModel");
const Section = require("../models/academics/sectionModel");
const AcademicYear = require("../models/academics/academicYearModel");
const FeeGroup = require("../models/fees/feeGroupModel");
const BoardingType = require("../models/studentInfo/boardingTypeModel");
const FeeType = require("../models/fees/feeTypeModel");
const FeeTerm = require("../models/fees/feeTermModel");
const FeeHead = require("../models/fees/feeHeadModel");
const Designation = require("../models/hr/designationModel");
const Department = require("../models/hr/departmentModel");
const Student = require("../models/studentInfo/studentModel");
const SubWard = require("../models/studentInfo/subwardTypeModel");
const Stream = require("../models/academics/streamModel");
const LibrarySubject = require("../models/library/subjectModels");
const LibraryCategory = require("../models/library/categoryModel");
const Subject = require("../models/academics/subjectModel");

// @desc    Get boarding-type list
// @route   GET /api/util/boarding-type-list
// @access  Private
const getBoardingTypeList = asyncHandler(async (req, res) => {
  const types = await BoardingType.find().select("name").sort("name").lean();

  res.status(200).json(types.map((e) => e.name));
});

// @desc    Get subward-type list
// @route   GET /api/util/subward-type-list
// @access  Private
const getSubwardList = asyncHandler(async (req, res) => {
  const wards = await SubWard.find().select("name").sort("name").lean();

  res.status(200).json(wards.map((e) => e.name));
});

// @desc    Get bus-stop
// @route   GET /api/util/bus-stop-list
// @access  Private
const getBusStopList = asyncHandler(async (req, res) => {
  const search = req.query.search;
  const query = {};

  if (search) {
    query["$or"] = [
      { name: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
    ];
  }

  const busStops = await BusStop.find(query).select("name").lean();

  res.status(200).json(busStops.map((e) => e.name));
});

// @desc    Get drivers
// @route   GET /api/util/driver-list
// @access  Private
const getDriverList = asyncHandler(async (req, res) => {
  const { search, form } = req.query;
  const driver = [];

  const query = { type: "d" };
  const busQuery = {};

  const notDriver = [];
  if (form === "bus") {
    const buses = await Bus.find(busQuery).select("driver").lean();

    buses.forEach((b) => notDriver.push(b.driver.toString()));
  }

  if (search) {
    query["$or"] = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const drivers = await BusStaff.find(query)
    .select("name email phone")
    .sort("name")
    .lean();

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
  const conductor = [];

  const query = { type: "c" };
  const busQuery = {};

  const notConductor = [];
  if (form === "bus") {
    const buses = await Bus.find(busQuery).select("conductor").lean();

    buses.forEach((b) => notConductor.push(b.conductor.toString()));
  }

  if (search) {
    query["$or"] = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const drivers = await BusStaff.find(query)
    .select("name email phone")
    .sort("name")
    .lean();

  drivers.forEach((c) => {
    if (!notConductor.includes(c._id)) conductor.push(c);
  });

  res.status(200).json(conductor);
});

// @desc    Get buses
// @route   GET /api/util/bus-list
// @access  Private
const getBusList = asyncHandler(async (req, res) => {
  const search = req.query.search;
  const query = {};

  if (search) {
    query["$or"] = [{ name: { $regex: search, $options: "i" } }];
  }

  const buses = await Bus.find(query).select("name").lean();

  res.status(200).json(buses.map((e) => e.name));
});

// @desc    Get academic year
// @route   GET /api/util/academic-year-list
// @access  Private
const getAcademicYearList = asyncHandler(async (req, res) => {
  const years = await AcademicYear.find({}).select("title").lean();

  res.status(200).json(years.map((e) => e.title));
});

// @desc    Get sections
// @route   GET /api/util/section-list
// @access  Private
const getSectionList = asyncHandler(async (req, res) => {
  const academic_year = UC.getCurrentAcademicYear(req.school);

  const sections = await Section.find({ academic_year })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(sections.map((e) => e.name));
});

// @desc    Get streams
// @route   GET /api/util/stream-list
// @access  Private
const getStreamList = asyncHandler(async (req, res) => {
  const academic_year = UC.getCurrentAcademicYear(req.school);

  const streams = await Stream.find({ academic_year })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(streams.map((e) => e.name));
});

// @desc    Get classes
// @route   GET /api/util/class-list
// @access  Private
const getClassList = asyncHandler(async (req, res) => {
  const academic_year = UC.getCurrentAcademicYear(req.school);

  const classes = await Class.find({ academic_year })
    .select("name")
    .sort("name")
    .lean();

  const uniqueClasses = [];
  for (const c of classes) {
    if (!uniqueClasses.includes(c.name)) uniqueClasses.push(c.name);
  }

  res.status(200).json(uniqueClasses);
});

// @desc    Get subjects
// @route   GET /api/util/subject-list
// @access  Private
const getSubjectList = asyncHandler(async (req, res) => {
  const academic_year = UC.getCurrentAcademicYear(req.school);

  const subject = await Subject.find({ academic_year })
    .select("name code type")
    .sort("name")
    .lean();

  res.status(200).json(subject);
});

// @desc    Get fee-groups
// @route   GET /api/util/fee-group-list
// @access  Private
const getFeeGroupList = asyncHandler(async (req, res) => {
  const academic_year = UC.getCurrentAcademicYear(req.school);

  const groups = await FeeGroup.find({ academic_year })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(groups.map((e) => e.name));
});

// @desc    Get fee-types
// @route   GET /api/util/fee-type-list
// @access  Private
const getFeeTypeList = asyncHandler(async (req, res) => {
  const academic_year = UC.getCurrentAcademicYear(req.school);

  const types = await FeeType.find({ academic_year })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(types.map((e) => e.name));
});

// @desc    Get fee-terms
// @route   GET /api/util/fee-term-list
// @access  Private
const getFeeTermList = asyncHandler(async (req, res) => {
  const academic_year = UC.getCurrentAcademicYear(req.school);

  const terms = await FeeTerm.find({ academic_year })
    .select("name")
    .sort("year start_month")
    .lean();

  res.status(200).json(terms.map((e) => e.name));
});

// @desc    Get fee-heads
// @route   GET /api/util/fee-head-list
// @access  Private
const getFeeHeadList = asyncHandler(async (req, res) => {
  const academic_year = UC.getCurrentAcademicYear(req.school);

  const heads = await FeeHead.find({ academic_year })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(heads);
});

// @desc    Get designations
// @route   GET /api/util/designation-list
// @access  Private
const getDesignationList = asyncHandler(async (req, res) => {
  const designations = await Designation.find({})
    .select("title")
    .sort("title")
    .lean();

  res.status(200).json(designations);
});

// @desc    Get departments
// @route   GET /api/util/department-list
// @access  Private
const getDepartmentList = asyncHandler(async (req, res) => {
  const departments = await Department.find({})
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(departments.map((e) => e.name));
});

// @desc    Get library category
// @route   GET /api/util/library-category-list
// @access  Private
const getLibraryCategoryList = asyncHandler(async (req, res) => {
  const categorys = await LibraryCategory.find({})
    .select("title")
    .sort("title")
    .lean();

  res.status(200).json(categorys.map((e) => e.title));
});

// @desc    Get library subjects
// @route   GET /api/util/library-subject-list
// @access  Private
const getLibrarySubjectList = asyncHandler(async (req, res) => {
  const subjects = await LibrarySubject.find({})
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(subjects.map((e) => e.name));
});

module.exports = {
  getBoardingTypeList,
  getSubwardList,
  getDriverList,
  getConductorList,
  getBusList,
  getBusStopList,
  getAcademicYearList,
  getSectionList,
  getStreamList,
  getClassList,
  getSubjectList,
  getFeeGroupList,
  getFeeTypeList,
  getFeeTermList,
  getFeeHeadList,
  getDesignationList,
  getDepartmentList,
  getLibraryCategoryList,
  getLibrarySubjectList,
};
