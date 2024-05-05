const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const AcademicYear = require("../models/academics/academicYearModel");
const Class = require("../models/academics/classModel");
const User = require("../models/system/userModel");
const Section = require("../models/academics/sectionModel");
const Student = require("../models/studentInfo/studentModel");
const Subject = require("../models/academics/subjectModel");
const School = require("../models/system/schoolModel");

/** 1. Academic Year */

// @desc    Get all academic-years
// @route   GET /api/academics/academic-year
// @access  Private
const getAcademicYears = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "year";
  const search = req.query.search;

  const query = { school: req.school };

  if (search) {
    const fields = ["year", "title"];
    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    AcademicYear,
    query,
    "year title",
    page,
    limit,
    sort,
    ["school", "name"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a academic-year
// @route   GET /api/academics/academic-year/:id
// @access  Private
const getAcademicYear = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user.school;

  const academicYear = await AcademicYear.findOne(query)
    .populate("school", "name")
    .lean();

  if (!academicYear) {
    res.status(404);
    throw new Error(C.getResourse404Id("AcademicYear", req.params.id));
  }

  res.status(200).json(academicYear);
});

// @desc    Add a academic-year
// @route   POST /api/academics/academic-year
// @access  Private
const addAcademicYear = asyncHandler(async (req, res) => {
  const year = req.body.year;
  let starting_date = req.body.starting_date;
  let ending_date = req.body.ending_date;
  const setDefault = req.body.set_default;

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
    school: req.school,
  });

  if (setDefault) {
    await School.updateOne(
      { _id: req.school },
      { $set: { current_academic_year: academicYear._id } }
    );
  }

  res.status(201).json({ msg: academicYear._id });
});

// @desc    Update a academic-year
// @route   PUT /api/academics/academic-year/:id
// @access  Private
const updateAcademicYear = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user.school;

  if (!(await AcademicYear.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("AcademicYear", req.params.id));
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
    throw new Error(C.getResourse404Id("AcademicYear", req.params.id));
  }

  if (await Section.any({ academic_year: ayear._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("AcademicYear", "Section"));
  } else if (await Student.any({ academic_year: ayear._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("AcademicYear", "Section"));
  }

  const delQuery = { _id: req.params.id };

  if (C.isSchool(req.user.type)) delQuery.school = req.user.school;

  const result = await AcademicYear.deleteOne(delQuery);

  res.status(200).json(result);
});

// @desc    Set current academic-year
// @route   POST /api/academics/academic-year/set-current
// @access  Private
const setCurrentAcademicYear = asyncHandler(async (req, res) => {
  const [manager, school] = await UC.validateManagerAndSchool(
    req.user,
    req.body.manager,
    req.body.school
  );

  const ayear = req.body.ayear;
  if (!ayear) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ayear"));
  }

  if (!(await AcademicYear.any({ _id: ayear, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("ayear", ayear));
  }

  const result = await School.updateOne(
    { _id: school },
    { $set: { current_academic_year: ayear } }
  );

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
  const search = req.query.search;

  const ayear = await UC.getCurrentAcademicYear(req.school);

  const query = { academic_year: ayear };

  if (search) {
    const fields = ["name"];
    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
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

  if (C.isSchool(req.user.type)) query.school = req.user.school;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const section = await Section.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!section) {
    res.status(404);
    throw new Error(C.getResourse404Id("Section", req.params.id));
  }

  res.status(200).json(section);
});

// @desc    Add a section
// @route   POST /api/academics/section
// @access  Private
const addSection = asyncHandler(async (req, res) => {
  const ayear = await UC.getCurrentAcademicYear(req.school);

  const section = await Section.create({
    name: req.body.name,
    academic_year: ayear,
    school: req.school,
  });

  res.status(201).json({ msg: section._id });
});

// @desc    Update a section
// @route   PUT /api/academics/section/:id
// @access  Private
const updateSection = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user.school;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await Section.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("Section", req.params.id));
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
    query.school = req.user.school;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const section = await Section.findOne(query).select("_id").lean();

  if (!section) {
    res.status(400);
    throw new Error(C.getResourse404Id("Section", req.params.id));
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
  const search = req.query.search;

  const school = await UC.validateSchool(req.user, req.school);
  const ayear = await UC.getCurrentAcademicYear(req.school);

  const query = { academic_year: ayear };

  if (search) {
    const fields = ["name"];
    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    Class,
    query,
    "name sections",
    page,
    limit,
    sort,
    ["sections", "name"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  for (const class_ of results.result) {
    const sections = [];
    for (const s of class_.sections) {
      const students = await Student.countDocuments({
        class: class_,
        section: s._id,
      });

      sections.push({ ...s, students });
    }
    class_.sections = sections;
  }

  res.status(200).json(results);
});

// @desc    Get a class
// @route   GET /api/academics/class/:id
// @access  Private
const getClass = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user.school;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const stuClass = await Class.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!stuClass) {
    res.status(404);
    throw new Error(C.getResourse404Id("Class", req.params.id));
  }

  res.status(200).json(stuClass);
});

// @desc    Add a class
// @route   POST /api/academics/class
// @access  Private
const addClass = asyncHandler(async (req, res) => {
  const sections = req.body.sections;

  const ayear = await UC.getCurrentAcademicYear(req.school);

  // Validate Section
  if (!sections || sections.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("sections"));
  }

  const sectionIds = [];
  for (const s of sections) {
    const section = await Section.findOne({
      name: s.toUpperCase(),
      academic_year: ayear,
    })
      .select("_id")
      .lean();

    if (!section) {
      res.status(400);
      throw new Error(C.getResourse404Id("section", s));
    }

    sectionIds.push(section._id);
  }

  const class_ = await Class.create({
    name: req.body.name,
    sections: sectionIds, //: sections.map((section) => ({ section })),
    academic_year: ayear,
    school: req.school,
  });

  res.status(201).json({ msg: class_._id });
});

// @desc    Update a class
// @route   PUT /api/academics/class/:id
// @access  Private
const updateClass = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user.school;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await Class.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("Class", req.params.id));
  }

  const section = req.body.section;

  if (section) {
    if (!(await Section.any({ ...query, _id: section }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("Section", section));
    }
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
    query.school = req.user.school;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const class_ = await Class.findOne(query).select("_id").lean();

  if (!class_) {
    res.status(400);
    throw new Error(C.getResourse404Id("Class", req.params.id));
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
  const search = req.query.search;

  let manager = req.query.manager;
  let school = req.query.school;

  [manager, school] = await UC.validateManagerAndSchool(
    req.user,
    manager,
    school
  );

  const ayear = await UC.getCurrentAcademicYear(req.school);

  const query = { academic_year: ayear };

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
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

  if (C.isSchool(req.user.type)) query.school = req.user.school;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const subject = await Subject.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!subject) {
    res.status(404);
    throw new Error(C.getResourse404Id("Subject", req.params.id));
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

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Id("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Id("school", school));
  }

  if (!(await AcademicYear.any({ _id: ayear, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("ayear", ayear));
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

  if (C.isSchool(req.user.type)) query.school = req.user.school;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const subject = await Subject.findOne(query).select("_id").lean();

  if (!subject) {
    res.status(404);
    throw new Error(C.getResourse404Id("Subject", req.params.id));
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
    query.school = req.user.school;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const result = await Subject.deleteOne(query);

  res.status(200).json(result);
});

module.exports = {
  getAcademicYears,
  getAcademicYear,
  addAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  setCurrentAcademicYear,

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
};
