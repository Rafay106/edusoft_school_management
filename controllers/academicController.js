const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const AcademicYear = require("../models/academics/academicYearModel");
const Class = require("../models/academics/classModel");
const Section = require("../models/academics/sectionModel");
const Student = require("../models/studentInfo/studentModel");
const Subject = require("../models/academics/subjectModel");
const School = require("../models/system/schoolModel");
const Stream = require("../models/academics/streamModel");
const ClassRoutine = require("../models/academics/classRoutineModel");

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
    "",
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
  const ayear = req.body.ayear;

  if (!ayear) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ayear"));
  }

  if (!(await AcademicYear.any({ _id: ayear, school: req.school._id }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("ayear", ayear));
  }

  const result = await School.updateOne(
    { _id: req.school._id },
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

  const query = { academic_year: req.ayear };

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

  const section = await Section.findOne(query).lean();

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
  const names = req.body.names;

  if (!names || names.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("names"));
  }

  const nameObj = {};
  for (const name of names) {
    if (!nameObj[name]) nameObj[name] = 1;
    else nameObj[name] += 1;
  }

  const uniqueNames = Object.keys(nameObj);
  const sections = [];

  for (const name of uniqueNames) {
    const section = await Section.create({
      name,
      academic_year: req.ayear,
      school: req.school,
    });

    sections.push(section._id);
  }

  res.status(201).json({ total: sections.length, msg: sections });
});

// @desc    Update a section
// @route   PUT /api/academics/section/:id
// @access  Private
const updateSection = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

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
// @route   DELETE /api/academics/section
// @access  Private
const deleteSection = asyncHandler(async (req, res) => {
  const ids = req.body.ids;

  if (!ids || ids.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ids"));
  }

  const results = {
    acknowledged: true,
    deletedCount: 0,
  };

  for (const _id of ids) {
    const query = { _id };

    const section = await Section.findOne(query).select("_id").lean();

    if (!section) {
      res.status(400);
      throw new Error(C.getResourse404Id("Section", _id));
    }

    if (await Class.any({ section: section._id })) {
      res.status(400);
      throw new Error(C.getUnableToDel("Section", "Class"));
    }

    const result = await Section.deleteOne(query);
    results.deletedCount += result.deletedCount;
  }

  res.status(200).json(results);
});

/** 3. Stream */

// @desc    Get all streams
// @route   GET /api/academics/stream
// @access  Private
const getStreams = asyncHandler(async (req, res) => {
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

  const results = await UC.paginatedQuery(Stream, query, {}, page, limit, sort);

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a stream
// @route   GET /api/academics/stream/:id
// @access  Private
const getStream = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const stream = await Stream.findOne(query).lean();

  if (!stream) {
    res.status(404);
    throw new Error(C.getResourse404Id("Stream", req.params.id));
  }

  res.status(200).json(stream);
});

// @desc    Add a stream
// @route   POST /api/academics/stream
// @access  Private
const addStream = asyncHandler(async (req, res) => {
  const stream = await Stream.create({
    name: req.body.name,
    academic_year: req.ayear,
    school: req.school,
  });

  res.status(201).json({ msg: stream._id });
});

// @desc    Update a stream
// @route   PUT /api/academics/stream/:id
// @access  Private
const updateStream = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await Stream.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("Stream", req.params.id));
  }

  const result = await Stream.updateOne(query, {
    $set: { name: req.body.name },
  });

  res.status(200).json(result);
});

// @desc    Delete a stream
// @route   DELETE /api/academics/stream/:id
// @access  Private
const deleteStream = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const stream = await Stream.findOne(query).select("_id").lean();

  if (!stream) {
    res.status(400);
    throw new Error(C.getResourse404Id("Stream", req.params.id));
  }

  if (await Class.any({ stream: stream._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("Stream", "Class"));
  }

  const result = await Stream.deleteOne(query);

  res.status(200).json(result);
});

/** 4. Class */

// @desc    Get all classes
// @route   GET /api/academics/class
// @access  Private
const getClasses = asyncHandler(async (req, res) => {
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
    Class,
    query,
    "name sections stream",
    page,
    limit,
    sort,
    ["sections stream", "name"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  for (const c of results.result) {
    const sections = [];

    // class_.name =
    //   class_.stream?.name === "NA"
    //     ? class_.name
    //     : `${class_.name}: ${class_.stream?.name}`;

    // delete class_.stream;
    for (const s of c.sections) {
      const students = await Student.countDocuments({
        class: c._id,
        section: s._id,
        stream: c.stream,
      });

      sections.push({ ...s, students });
    }

    c.sections = sections;
  }

  res.status(200).json(results);
});

// @desc    Get a class
// @route   GET /api/academics/class/:id
// @access  Private
const getClass = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const stuClass = await Class.findOne(query).lean();

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
  const names = req.body.names;
  const sections = [];
  const streams = [];

  // Validate names
  if (!names || names.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("names"));
  }

  // Validate sections
  if (!req.body.sections || req.body.sections.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("sections"));
  }

  for (const name of req.body.sections) {
    const s = await Section.findOne({
      name: name.toUpperCase(),
      academic_year: req.ayear,
    })
      .select("_id")
      .lean();

    if (!s) {
      res.status(400);
      throw new Error(C.getResourse404Id("sections", name));
    }

    sections.push(s._id);
  }

  // Validate streams
  if (!req.body.streams || req.body.streams.length === 0) {
    const s = await Stream.findOne({
      name: "NA",
      academic_year: req.ayear,
    })
      .select("_id")
      .lean();

    if (!s) {
      res.status(400);
      throw new Error(C.getResourse404Id("stream", "NA"));
    }

    streams.push(s._id);
  } else {
    for (const name of req.body.streams) {
      const s = await Stream.findOne({
        name: name.toUpperCase(),
        academic_year: req.ayear,
      })
        .select("_id")
        .lean();

      if (!s) {
        res.status(400);
        throw new Error(C.getResourse404Id("streams", name));
      }

      streams.push(s._id);
    }
  }

  const newClasses = [];
  for (const name of names) {
    for (const stream of streams) {
      const c = await Class.create({
        name,
        sections: sections,
        stream,
        academic_year: req.ayear,
        school: req.school,
      });

      newClasses.push(c._id);
    }
  }

  res.status(201).json({ msg: newClasses });
});

// @desc    Update a class
// @route   PUT /api/academics/class/:id
// @access  Private
const updateClass = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

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

/** 5. Subject */

// @desc    Get all subjects
// @route   GET /api/academics/subject
// @access  Private
const getSubjects = asyncHandler(async (req, res) => {
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

  const subject = await Subject.findOne(query)
    .populate("academic_year school", "name title")
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
  const subject = await Subject.create({
    name: req.body.name,
    code: req.body.code,
    type: req.body.type,
    academic_year: req.ayear,
    school: req.school,
  });

  res.status(201).json({ msg: subject._id });
});

// @desc    Update a subject
// @route   PUT /api/academics/subject/:id
// @access  Private
const updateSubject = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

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

  const result = await Subject.deleteOne(query);

  res.status(200).json(result);
});

/**  5 class_routine */

// @desc    Add a classRoutine
// @route   POST / api/academics/class-routine
// @access  Private
const addClassRoutine = asyncHandler(async (req, res) => {
  const ayear = await UC.getCurrentAcademicYear(req.school);
  if (!req.body.class) {
    res.status(400);
    throw new Error(C.getFieldIsReq("class"));
  }
  const c = await Class.findOne({ name: req.body.class.toUpperCase() })
    .select("_id")
    .lean();

if (!c) {
    res.status(400);
    throw new Error(C.getResourse404Id("class", req.body.class));
  }
  if (!req.body.section) {
    res.status(400);
    throw new Error(C.getFieldIsReq("section"));
  }
  const section = await Section.findOne({
    name: req.body.section.toUpperCase(),
  })
    .select("_id")
    .lean();
  if (!section) {
    res.status(400);
    throw new Error(C.getResourse404Id("section", req.body.section));
  }
  if (!req.body.subject) {
    res.status(400);
    throw new Error(C.getFieldIsReq("subject"));
  }
  const subject = await Subject.findOne({
    name: req.body.subject.toUpperCase(),
  })
    .select("_id")
    .lean();
  if (!subject) {
    res.status(400);
    throw new Error(C.getResourse404Id("subject", req.body.subject));
  }
  if (!req.body.start_time) {
    res.status(400);
    throw new Error(C.getResourse404("start_time"));
  }
  if (!req.body.end_time) {
    res.status(400);
    throw new Error(C.getResourse404("end_time"));
  }
  if (!req.body.break) {
    res.status(400);
    throw new Error(C.getResourse404("break"));
  }
  //  if (!req.body.other_day.week) {
  //   res.status(400);
  //   throw new Error(C.getResourse404("other_day's week"));
  // }
  if (!req.body.class_room) {
    res.status(400);
    throw new Error(C.getResourse404("class_room"));
  }

  const classRoutine = await ClassRoutine.create({
    class: c._id,
    section: section._id,
    week: req.body.week,
    subject: subject._id,
    teacher: req.body.teacher,
    start_time: req.body.start_time,
    end_time: req.body.end_time,
    break: req.body.break,
    other_day: req.body.other_day,
    class_room: req.body.class_room,
    academic_year: ayear,
    school: req.school,
  });
  res.status(201).json({ msg: classRoutine._id });
});

// @desc    get classRoutine
// @route   GET /api/academics/class-routine
// @access  Private
const getClassRoutine = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "class";
  const search = req.query.search;

  let classIdentifier = req.query.class;
  let section = req.query.section;

  const query = {};

  if (classIdentifier) {
    query.class = classIdentifier;
  }

  if (section) {
    query.section = section;
  }

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    ClassRoutine,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) {
    return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  }

  res.status(200).json(results);
});

// @desc    delete classRoutine
// @route   DELETE /api/academics/class-routine
// @access  private

const deleteClassRoutine = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (C.isSchool(req.user.type)) {
    query.school = req.user.school;
    query.manager = req.user.manager;
  }
  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }
  const result = await ClassRoutine.deleteOne(query);
  res.status(200).json(result);
});

module.exports = {
  getAcademicYears,
  getAcademicYear,
  addAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  setCurrentAcademicYear,

  getSections,
  getSection,
  addSection,
  updateSection,
  deleteSection,

  getStreams,
  getStream,
  addStream,
  updateStream,
  deleteStream,

  getClasses,
  getClass,
  addClass,
  updateClass,
  deleteClass,

  getSubjects,
  getSubject,
  addSubject,
  updateSubject,
  deleteSubject,

  addClassRoutine,
  getClassRoutine,
  deleteClassRoutine,
};
