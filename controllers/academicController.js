const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const AcademicYear = require("../models/academics/academicYearModel");
const Class = require("../models/academics/classModel");
const User = require("../models/system/userModel");
const Section = require("../models/academics/sectionModel");
const Student = require("../models/academics/studentModel");
const Bus = require("../models/transport/busModel");
const Subject = require("../models/academics/subjectModel");

/** 1. Academic Year */

// @desc    Get all academic-years
// @route   GET /api/academics/academic-year
// @access  Private
const getAcademicYears = asyncHandler(async (req, res) => {
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
      const fields = ["year", "title"];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
  }

  const results = await UC.paginatedQuery(
    AcademicYear,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a academic-year
// @route   GET /api/academics/academic-year/:id
// @access  Private
const getAcademicYear = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const academicYear = await AcademicYear.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!academicYear) {
    res.status(404);
    throw new Error(C.getResourse404Error("AcademicYear", req.params.id));
  }

  res.status(200).json(academicYear);
});

// @desc    Add a academic-year
// @route   POST /api/academics/academic-year
// @access  Private
const addAcademicYear = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;

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

  const year = req.body.year;
  let starting_date = req.body.starting_date;
  let ending_date = req.body.ending_date;

  if (year.length > 4) {
    res.status(400);
    throw new Error("The year must be 4 digits.");
  }

  if (isNaN(parseInt(year))) {
    res.status(400);
    throw new Error("The year must be a number.");
  }

  starting_date = new Date(starting_date).setUTCHours(0, 0, 0, 0);
  ending_date = new Date(ending_date).setUTCHours(0, 0, 0, 0);

  const academicYear = await AcademicYear.create({
    year,
    title: req.body.title,
    starting_date,
    ending_date,
    manager,
    school,
  });

  res.status(201).json({ msg: academicYear._id });
});

// @desc    Update a academic-year
// @route   PUT /api/academics/academic-year/:id
// @access  Private
const updateAcademicYear = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await AcademicYear.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Error("AcademicYear", req.params.id));
  }

  const year = req.body.year;
  let starting_date = req.body.starting_date;
  let ending_date = req.body.ending_date;

  if (year) {
    if (year.length > 4) {
      res.status(400);
      throw new Error("The year must be 4 digits.");
    }

    if (isNaN(parseInt(year))) {
      res.status(400);
      throw new Error("The year must be a number.");
    }
  }

  if (starting_date) {
    starting_date = new Date(starting_date).setUTCHours(0, 0, 0, 0);
  }

  if (ending_date) {
    ending_date = new Date(ending_date).setUTCHours(0, 0, 0, 0);
  }

  const result = await AcademicYear.updateOne(query, {
    $set: {
      year,
      title: req.body.title,
      starting_date,
      ending_date,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a academic-year
// @route   DELETE /api/academics/academic-year/:id
// @access  Private
const deleteAcademicYear = asyncHandler(async (req, res) => {
  const ayear = await AcademicYear.findById(req.params.id).select("_id").lean();

  if (!ayear) {
    res.status(400);
    throw new Error(C.getResourse404Error("AcademicYear", req.params.id));
  }

  if (await Section.any({ academic_year: ayear._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("AcademicYear", "Section"));
  } else if (await Student.any({ academic_year: ayear._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("AcademicYear", "Section"));
  }

  const delQuery = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    delQuery.user = req.user._id;
    delQuery.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    delQuery.manager = req.user._id;
  }

  const result = await AcademicYear.deleteOne(delQuery);

  res.status(200).json(result);
});

/** 2. Section */

// @desc    Get all sections
// @route   GET /api/academics/section
// @access  Private
const getSections = asyncHandler(async (req, res) => {
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
    Section,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a section
// @route   GET /api/academics/section/:id
// @access  Private
const getSection = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const section = await Section.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!section) {
    res.status(404);
    throw new Error(C.getResourse404Error("Section", req.params.id));
  }

  res.status(200).json(section);
});

// @desc    Add a section
// @route   POST /api/academics/section
// @access  Private
const addSection = asyncHandler(async (req, res) => {
  const ayear = req.body.ayear;
  let manager = req.body.manager;
  let school = req.body.school;

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

  const section = await Section.create({
    name: req.body.name,
    academic_year: ayear,
    manager,
    school,
  });

  res.status(201).json({ msg: section._id });
});

// @desc    Update a section
// @route   PUT /api/academics/section/:id
// @access  Private
const updateSection = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await Section.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Error("Section", req.params.id));
  }

  const result = await Section.updateOne(query, {
    $set: { name: req.body.name },
  });

  res.status(200).json(result);
});

// @desc    Delete a section
// @route   DELETE /api/academics/section/:id
// @access  Private
const deleteSection = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const section = await Section.findOne(query).select("_id").lean();

  if (!section) {
    res.status(400);
    throw new Error(C.getResourse404Error("Section", req.params.id));
  }

  if (await Class.any({ section: section._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("Section", "Class"));
  }

  const result = await Section.deleteOne(query);

  res.status(200).json(result);
});

/** 3. Class */

// @desc    Get all classes
// @route   GET /api/academics/class
// @access  Private
const getClasses = asyncHandler(async (req, res) => {
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

  const results = await UC.paginatedQuery(Class, query, {}, page, limit, sort);

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a class
// @route   GET /api/academics/class/:id
// @access  Private
const getClass = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const stuClass = await Class.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!stuClass) {
    res.status(404);
    throw new Error(C.getResourse404Error("Class", req.params.id));
  }

  res.status(200).json(stuClass);
});

// @desc    Add a class
// @route   POST /api/academics/class
// @access  Private
const addClass = asyncHandler(async (req, res) => {
  const section = req.body.section;
  const ayear = req.body.ayear;
  let manager = req.body.manager;
  let school = req.body.school;

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

  // Validate Section
  if (!section) {
    res.status(400);
    throw new Error(C.getFieldIsReq("section"));
  }

  if (!(await Section.any({ _id: section, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("section", section));
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

  const class_ = await Class.create({
    name: req.body.name,
    section,
    academic_year: ayear,
    manager,
    school,
  });

  res.status(201).json({ msg: class_._id });
});

// @desc    Update a class
// @route   PUT /api/academics/class/:id
// @access  Private
const updateClass = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await Class.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Error("Class", req.params.id));
  }

  const section = req.body.section;

  if (!(await Section.any({ ...query, _id: section }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Section", section));
  }

  const result = await Class.updateOne(query, {
    $set: { name: req.body.name, section },
  });

  res.status(200).json(result);
});

// @desc    Delete a class
// @route   DELETE /api/academics/class/:id
// @access  Private
const deleteClass = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const class_ = await Class.findOne(query).select("_id").lean();

  if (!class_) {
    res.status(400);
    throw new Error(C.getResourse404Error("Class", req.params.id));
  }

  if (await Student.any({ class: class_._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("Class", "Student"));
  }

  const result = await Class.deleteOne(query);

  res.status(200).json(result);
});

/** 3. Subject */

// @desc    Get all subjects
// @route   GET /api/academics/subject
// @access  Private
const getSubjects = asyncHandler(async (req, res) => {
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
    Subject,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a subject
// @route   GET /api/academics/subject/:id
// @access  Private
const getSubject = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const subject = await Subject.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!subject) {
    res.status(404);
    throw new Error(C.getResourse404Error("Subject", req.params.id));
  }

  res.status(200).json(subject);
});

// @desc    Add a subject
// @route   POST /api/academics/subject
// @access  Private
const addSubject = asyncHandler(async (req, res) => {
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

  if (!(await AcademicYear.any({ _id: ayear, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("ayear", ayear));
  }

  const subject = await Subject.create({
    name: req.body.name,
    code: req.body.code,
    type: req.body.type,
    academic_year: req.body.ayear,
    manager,
    school,
  });

  res.status(201).json({ msg: subject._id });
});

// @desc    Update a subject
// @route   PUT /api/academics/subject/:id
// @access  Private
const updateSubject = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const subject = await Subject.findOne(query).select("_id").lean();

  if (!subject) {
    res.status(404);
    throw new Error(C.getResourse404Error("Subject", req.params.id));
  }

  const result = await Subject.updateOne(query, {
    $set: {
      name: req.body.name,
      code: req.body.code,
      type: req.body.type,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a subject
// @route   DELETE /api/academics/subject/:id
// @access  Private
const deleteSubject = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const result = await Subject.deleteOne(query);

  res.status(200).json(result);
});

/** . Student */

// @desc    Get all students
// @route   GET /api/academics/student
// @access  Private
const getStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const searchField = req.query.sf;
  const searchValue = req.query.sv;

  const query = {};

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  } else if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = [
        "name.f",
        "name.m",
        "name.l",
        "phone",
        "email",
        "admissionNo",
        "gender",
      ];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
  }

  const results = await UC.paginatedQuery(
    Student,
    query,
    "name gender phone email admissionNo",
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a student
// @route   GET /api/academics/student/:id
// @access  Private
const getStudent = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  } else if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const student = await Student.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!student) {
    res.status(404);
    throw new Error(C.getResourse404Error("Student", req.params.id));
  }

  res.status(200).json(student);
});

// @desc    Get required data to add a student
// @route   GET /api/academics/student/required-data
// @access  Private
const requiredDataStudent = asyncHandler(async (req, res) => {
  const busQuery = {};
  const bus = [];

  if (C.isSchool(req.user.type)) {
    busQuery.user = req.user._id;
    busQuery.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    busQuery.manager = req.user._id;
  }

  res.status(200).json({
    type: type.sort(),
  });
});

// @desc    Add a student
// @route   POST /api/academics/student
// @access  Private
const addStudent = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;
  const ayear = req.body.ayear;
  const class_ = req.body.class;

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

  if (!(await User.any({ _id: manager, type: C.MANAGER }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await User.any({ _id: school, type: C.SCHOOL, manager }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const name = {
    f: req.body.fname,
    m: req.body.mname,
    l: req.body.lname,
  };

  const photo = req.file
    ? req.file.path.toString().replace("uploads\\", "").replace("\\", "/")
    : "";

  const address = {
    current: req.body.address_current,
    permanent: req.body.address_permanent,
  };

  // Validate academic-year
  if (!ayear) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ayear"));
  }

  if (!(await AcademicYear.any({ _id: ayear, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("AcademicYear", ayear));
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

  // Validate bus
  if (!req.body.bus) {
    res.status(400);
    throw new Error(C.getFieldIsReq("bus"));
  }

  const bus = await Bus.findOne({ _id: req.body.bus, manager, school })
    .select("stops")
    .lean();

  if (!bus) {
    res.status(400);
    throw new Error(C.getResourse404Error("bus", req.body.bus));
  }

  // Validate bus-stop
  if (!req.body.busStop) {
    res.status(400);
    throw new Error(C.getFieldIsReq("busStop"));
  }

  if (!bus.stops.find((s) => s.toString() === req.body.busStop)) {
    res.status(400);
    throw new Error(C.getResourse404Error("busStop", req.body.busStop));
  }

  const student = await Student.create({
    admission_no: req.body.admNo,
    roll_no: req.body.rollNo,
    name,
    dob: req.body.dob,
    cast: req.body.cast,
    email: req.body.email,
    phone: req.body.phone,
    doa: req.body.doa,
    photo,
    age: req.body.age,
    height: req.body.height,
    weight: req.body.weight,
    address,
    rfid: req.body.rfid,
    gender: req.body.gender,
    academic_year: req.body.ayear,
    class: req.body.class,
    bus: req.body.bus,
    bus_stop: req.body.busStop,
    manager,
    school,
  });

  res.status(201).json({ msg: student._id });
});

// @desc    Update a student
// @route   PUT /api/academics/student/:id
// @access  Private
const updateStudent = asyncHandler(async (req, res) => {
  const query = [C.SUPERADMIN, C.ADMIN].includes(req.user.type)
    ? { _id: req.params.id }
    : { _id: req.params.id, manager: req.user._id };

  if (!(await Student.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Student", req.params.id));
  }

  let manager = req.body.manager;
  const isAdmins = [C.SUPERADMIN, C.ADMIN].includes(req.user.type);
  if (isAdmins && manager) {
    if (!(await User.any({ _id: manager }))) {
      res.status(400);
      throw new Error(C.getResourse404Error("User", manager));
    }
  } else manager = req.user._id;

  const result = await Student.updateOne(query, {
    $set: {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
      pincode: req.body.pincode,
      lat: parseFloat(req.body.lat).toFixed(6),
      lon: parseFloat(req.body.lon).toFixed(6),
      radius: req.body.radius,
      manager,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a student
// @route   DELETE /api/academics/student/:id
// @access  Private
const deleteStudent = asyncHandler(async (req, res) => {
  const query = [C.SUPERADMIN, C.ADMIN].includes(req.user.type)
    ? { _id: req.params.id }
    : { _id: req.params.id, manager: req.user._id };

  const result = await Student.deleteOne(query);

  if (result.deletedCount === 0) {
    res.status(400);
    throw new Error(C.getResourse404Error("Student", req.params.id));
  }

  res.status(200).json(result);
});

// @desc    Bulk operations for student
// @route   POST /api/academics/student/bulk
// @access  Private
const bulkOpsStudent = asyncHandler(async (req, res) => {
  const cmd = req.body.cmd;
  const students = req.body.students;

  if (!cmd) {
    res.status(400);
    throw new Error("cmd is required!");
  }

  if (cmd === "import") {
    const fileData = UC.excelToJson(
      path.join("imports", "student", req.file.filename)
    );

    const result = await UC.addMultipleStudents(
      req.user._id,
      req.user.type,
      fileData
    );

    if (result.status === 400) {
      res.status(result.status);
      const err = new Error(result.errors);
      err.name = "BulkImportError";
      throw err;
    }

    console.log("req.file :>> ", req.file);

    fs.unlinkSync(path.join(req.file.path));

    return res.status(200).json({ msg: result.msg });
  }

  if (!students) {
    res.status(400);
    throw new Error(C.getFieldIsReq("students"));
  }

  if (students.length === 0) {
    res.status(400);
    throw new Error("students array is empty!");
  }

  const query = [C.SUPERADMIN, C.ADMIN].includes(req.user.type)
    ? { _id: students }
    : { _id: students, manager: req.user._id };

  if (cmd === "delete") {
    const result = await Student.deleteMany(query);

    return res.status(200).json(result);
  } else if (cmd === "export-json") {
    const studentsToExport = await Student.find(query)
      .select("-createdAt -updatedAt")
      .sort("name")
      .lean();

    const dt = new Date();
    const Y = String(dt.getUTCFullYear()).padStart(2, "0");
    const M = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const D = String(dt.getUTCDate()).padStart(2, "0");

    const fileName = `Student_${Y}-${M}-${D}.json`;
    const fileDir = path.join(getAppRootDir(__dirname), "temp", fileName);

    fs.writeFileSync(fileDir, JSON.stringify(studentsToExport));

    return res.download(fileDir, fileName, () => {
      fs.unlinkSync(fileDir);
    });
  } else {
    res.status(400);
    throw new Error("cmd not found!");
  }
});

module.exports = {
  getAcademicYears,
  getAcademicYear,
  addAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,

  getClasses,
  getClass,
  addClass,
  updateClass,
  deleteClass,

  getSections,
  getSection,
  addSection,
  updateSection,
  deleteSection,

  getSubjects,
  getSubject,
  addSubject,
  updateSubject,
  deleteSubject,

  getStudents,
  getStudent,
  addStudent,
  updateStudent,
  deleteStudent,
  bulkOpsStudent,
};
