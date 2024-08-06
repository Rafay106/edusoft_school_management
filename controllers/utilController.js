const fs = require("node:fs");
const path = require("node:path");
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
const Designation = require("../models/hr/designationModel");
const Department = require("../models/hr/departmentModel");
const Student = require("../models/studentInfo/studentModel");
const SubWard = require("../models/studentInfo/subwardTypeModel");
const Stream = require("../models/academics/streamModel");
const LibrarySubject = require("../models/library/subjectModels");
const LibraryCategory = require("../models/library/categoryModel");
const Subject = require("../models/academics/subjectModel");
const User = require("../models/system/userModel");
const Role = require("../models/system/roleModel");
const Bank = require("../models/account/bankModel");
const Chart = require("../models/account/chartModel");

// @desc    Get roles list
// @route   GET /api/util/role-list
// @access  Private
const getRoleList = asyncHandler(async (req, res) => {
  const query = {};

  if (UC.isSchool(req.user)) query.access = "user";

  const roles = await Role.find(query).select("title").sort("title").lean();

  res.status(200).json(roles);
});

// @desc    Get usertype list with count
// @route   GET /api/util/usertype-list-with-count
// @access  Private
const getUsertypeListWithCount = asyncHandler(async (req, res) => {
  const usertypes = [
    C.ACCOUNTANT,
    C.BUS_STAFF,
    C.LIBRARIAN,
    C.PARENT,
    C.RECEPTIONIST,
    C.STUDENT,
    C.TEACHER,
  ];

  if (UC.isSuperAdmin(req.user)) {
    console.log("superadmin");
    usertypes.push(C.SUPERADMIN, C.ADMIN, C.SCHOOL);
  } else if (UC.isAdmin(req.user)) {
    usertypes.push(C.SCHOOL);
  }

  const result = [];

  const ROLES = await Role.find().select("title").lean();

  for (const ut of usertypes.sort()) {
    if (ut === C.STUDENT) {
      result.push({
        usertype: ut,
        users: await Student.countDocuments(),
      });
    } else {
      const role = ROLES.find((ele) => ele.title === ut);
      result.push({
        usertype: ut,
        users: await User.countDocuments({ role }),
      });
    }
  }

  res.status(200).json(result);
});

// @desc    Get user list
// @route   GET /api/util/user-list
// @access  Private
const getUserList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";

  let usertype = req.query.usertype;
  const search = req.query.search;

  if (!usertype) {
    res.status(400);
    throw new Error(C.getFieldIsReq("usertype"));
  }

  if (UC.isAdmin(req.user)) {
    if ([C.SUPERADMIN, C.ADMIN].includes(usertype)) usertype = "";
  } else if (UC.isSchool(req.user)) {
    if ([C.SUPERADMIN, C.ADMIN, C.SCHOOL].includes(usertype)) usertype = "";
  }

  const query = {};

  if (search) {
    query["$or"] = [
      { name: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
    ];
  }

  if (usertype === C.STUDENT) {
    const results = await UC.paginatedQuery(
      Student,
      query,
      "name",
      page,
      limit,
      sort
    );

    if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

    return res.status(200).json(results);
  }

  const roleId = await UC.getRoleId(usertype);

  if (roleId) query.role = roleId;

  const results = await UC.paginatedQuery(
    User,
    query,
    "name",
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get parent and employees list
// @route   GET /api/util/parent-employee-list
// @access  Private
const getParentAndEmployeeList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const includeRoles = await Role.find({ access: "user" }).select("_id").lean();

  const query = { role: includeRoles.map((ele) => ele._id) };

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const select = "name";

  const results = await UC.paginatedQuery(
    User,
    query,
    select,
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get boarding-type list
// @route   GET /api/util/boarding-type-list
// @access  Private
const getBoardingTypeList = asyncHandler(async (req, res) => {
  const types = await BoardingType.find().select("name").sort("name").lean();

  res.status(200).json(types);
});

// @desc    Get subward-type list
// @route   GET /api/util/subward-type-list
// @access  Private
const getSubwardList = asyncHandler(async (req, res) => {
  const wards = await SubWard.find().select("name").sort("name").lean();

  res.status(200).json(wards);
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

  res.status(200).json(busStops);
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

  const buses = await Bus.find(query).select("name device.imei").lean();

  res.status(200).json(buses);
});

// Academics

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
  const sections = await Section.find({ academic_year: req.ayear })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(sections);
});

// @desc    Get sections of a class
// @route   GET /api/util/section-list-of-class
// @access  Private
const getSectionListOfClass = asyncHandler(async (req, res) => {
  const id = await UC.validateClassByName(req.query.class, req.ayear);

  const c = await Class.findById(id)
    .select("sections")
    .populate("sections", "name");

  res.status(200).json(c.sections.sort());
});

// @desc    Get streams
// @route   GET /api/util/stream-list
// @access  Private
const getStreamList = asyncHandler(async (req, res) => {
  const streams = await Stream.find({ academic_year: req.ayear })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(streams);
});

// @desc    Get classes
// @route   GET /api/util/class-list
// @access  Private
const getClassList = asyncHandler(async (req, res) => {
  const classes = await Class.find({ academic_year: req.ayear })
    .select("name stream")
    .populate("stream", "name")
    .sort("name")
    .lean();

  const uniqueClasses = [];
  for (const c of classes) {
    const name = c.stream.name === "NA" ? c.name : c.name + " " + c.stream.name;
    uniqueClasses.push({ _id: c._id, name });
  }

  res.status(200).json(uniqueClasses);
});

// @desc    Get classes with section
// @route   GET /api/util/class-with-section-list
// @access  Private
const getClassWithSectionList = asyncHandler(async (req, res) => {
  const classes = await Class.find({ academic_year: req.ayear })
    .select("name sections stream")
    .populate("sections stream", "name")
    .sort("name")
    .lean();

  const uniqueClasses = ["total"];
  for (const c of classes) {
    for (const s of c.sections) {
      const name =
        c.stream.name === "NA"
          ? `${c.name}-${s.name}`
          : `${c.name}-${s.name}` + " " + c.stream.name;

      uniqueClasses.push(name);
    }
  }

  res.status(200).json(uniqueClasses);
});

// @desc    Get subjects
// @route   GET /api/util/subject-list
// @access  Private
const getSubjectList = asyncHandler(async (req, res) => {
  const subject = await Subject.find({ academic_year: req.ayear })
    .select("name code type")
    .sort("name")
    .lean();

  res.status(200).json(subject);
});

// Fee

// @desc    Get fee-groups
// @route   GET /api/util/fee-group-list
// @access  Private
const getFeeGroupList = asyncHandler(async (req, res) => {
  const groups = await FeeGroup.find({ academic_year: req.ayear })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(groups);
});

// @desc    Get fee-types
// @route   GET /api/util/fee-type-list
// @access  Private
const getFeeTypeList = asyncHandler(async (req, res) => {
  const types = await FeeType.find({ academic_year: req.ayear })
    .select("name")
    .sort("name")
    .lean();

  res.status(200).json(types);
});

// @desc    Get fee-terms
// @route   GET /api/util/fee-term-list
// @access  Private
const getFeeTermList = asyncHandler(async (req, res) => {
  const terms = await FeeTerm.find({ academic_year: req.ayear })
    .select("name")
    .sort("year start_month")
    .lean();

  res.status(200).json(terms);
});

// HR

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

  res.status(200).json(departments);
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

  res.status(200).json(subjects);
});

// Account

// @desc    Get banks
// @route   GET /api/util/bank-list
// @access  Private
const getBankList = asyncHandler(async (req, res) => {
  const banks = await Bank.find().select("bank_name").sort("bank_name").lean();

  res.status(200).json(banks);
});

// @desc    Get account charts
// @route   GET /api/util/chart-list
// @access  Private
const getChartList = asyncHandler(async (req, res) => {
  const charts = await Chart.find().select("head").sort("head").lean();

  res.status(200).json(charts);
});

// @desc    Create a excel file from json data
// @route   GET /api/util/excel-from-json
// @access  Private
const getExcelFromJson = asyncHandler(async (req, res) => {
  const select = req.body.select || [];
  const jsonData = req.body.data;

  if (!jsonData) {
    res.status(400);
    throw new Error(C.getFieldIsReq("data"));
  }

  const excelData = [];

  for (const item of jsonData) {
    let data = {};

    if (select.length) {
      for (const key of select) {
        data[key] = item[key];
      }
    } else data = item;

    excelData.push(data);
  }

  const fileName = `${new Date().getTime()}.xlsx`;

  const folderPath = path.join("data", "excels");
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  const filePath = path.join(folderPath, fileName);

  UC.jsonToExcel(filePath, excelData);

  res.status(200).json({ file: `${process.env.DOMAIN}/excels/${fileName}` });
});

module.exports = {
  getRoleList,
  getUsertypeListWithCount,
  getUserList,
  getParentAndEmployeeList,
  getBoardingTypeList,
  getSubwardList,
  getDriverList,
  getConductorList,
  getBusList,
  getBusStopList,
  getAcademicYearList,
  getSectionList,
  getSectionListOfClass,
  getStreamList,
  getClassList,
  getClassWithSectionList,
  getSubjectList,
  getFeeGroupList,
  getFeeTypeList,
  getFeeTermList,
  getDesignationList,
  getDepartmentList,
  getLibraryCategoryList,
  getLibrarySubjectList,
  getBankList,
  getChartList,

  getExcelFromJson,
};
