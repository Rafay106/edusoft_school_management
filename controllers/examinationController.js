const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");

const ExamType = require("../models/examination/examtypeModel");
const ExamSchedule = require("../models/examination/examScheduleModel");
const ExamClassSubject = require("../models/examination/examClassSubjectModel");
const Classs = require("../models/academics/classModel");
const Section = require("../models/academics/sectionModel");
const Subject = require("../models/academics/subjectModel");
const Term = require("../models/examination/examtypeModel");
const ExamSubjectMarks = require("../models/examination/examSubjectMarksModel");

// @desc    Add examtype
// @route   POST /api/examtype/
// @access  Private
const addExamType = asyncHandler(async (req, res) => {
  const examType = await ExamType.create({
    name: req.body.name,
    school: req.school,
    academic_year: req.ayear,
  });
  res.status(200).json({ msg: examType._id });
});

// @desc    get examtypes
// @route   GET /api/examination/type/
// @access  Private
const getExamTypes = asyncHandler(async (req, res) => {
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

  const results = await UC.paginatedQuery(
    ExamType,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  console.log(results);

  res.status(200).json(results);
});

// @desc    get examtype
// @route   GET /api/examination/type/:id
// @access  Private

const getExamType = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  const examType = ExamType.findOne(query).lean();

  if (!examType) {
    res.status(400);
    throw new Error(C.getResourse404Id("examType", req.params.id));
  }

  res.status(201).json(examType);
});

// @desc    update examtwype
// @route   PATCH /api/examination/type/:id
// @access  Private

const updateExamType = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (!(await ExamType.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Id("ExamType", req.params.id));
  }

  const result = await ExamType.updateOne(query, {
    $set: { name: req.body.name },
  });
  res.status(201).json(result);
});

// @desc    delete examtwype
// @route   DELETE /api/examination/type/:id
// @access  Private

const deleteExamtype = asyncHandler(async (req, res) => {
  const examtype = ExamType.findById(req.params.id).select("_id").lean();
  if (!examtype) {
    res.status(400);
    throw new Error(C.getResourse404Error("examtype", req.params.id));
  }

  const delQuery = { _id: req.params.id };

  const deletedHomework = await ExamType.deleteOne(delQuery);
  res.status(200).json(deletedHomework);
});

// @desc    get examSchedule
// @route   GET /api/examination/schedule
// @access  Private
const getExamSchedules = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "exam_type";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["exam_type"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    ExamSchedule,
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

// @desc    Get examSchedule
// @route   GET /api/examination/schedule/:id
// @access  Private

const getExamSchedule = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  const examSchedule = ExamSchedule.findOne(query);
  if (!examSchedule) {
    res.status(400);
    throw new Error("examSchedule", req.params.id);
  }

  res.status(200).json(examSchedule);
});

// @desc    Add examSchedule
// @route   POST /api/examination/schedule
// @access  Private

const addExamSchedule = asyncHandler(async (req, res) => {
  const exType = ExamType.findOne({
    name: req.body.exam_type.toUpperCase(),
  })
    .select("_id")
    .lean();
  console.log("exam schedule is ", exType);
  const examSchedule = await ExamSchedule.create({
    exam_type: exType._id,
    exam_start: req.body.exam_start,
    exam_end: req.body.exam_end,
    attendance_start: req.body.attendance_start,
    attendance_end: req.body.attendance_end,
    school: req.school,
    academic_year: req.ayear,
  });
  res.status(200).json({ msg: examSchedule._id });
});

// @desc    update a examSchedule
// @route   PATCH /api/examination/schedule/:id
// @access  Private
const updateExamShedule = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await ExamSchedule.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("examSchedule", req.params.id));
  }

  const updatedExamSchedule = await ExamSchedule.updateOne(query, {
    $set: {
      exam_start: req.body.exam_start,
      exam_end: req.body.exam_end,
      attendance_start: req.body.attendance_start,
      attendance_end: req.body.attendance_end,
    },
  });

  res.status(200).json(updatedExamSchedule);
});

// @desc delete examSchedule
// @route DELETE /api/examination/schedule/:id
// @access private
const deleteExamSchedule = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (!(await ExamSchedule.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("examSchedule", req.params.id));
  }

  const delQuery = { _id: req.params.id };
  const result = await ExamSchedule.findOne(delQuery);
  res.status(200).json(result);
});

// @desc    get examClassSubjects
// @route   GET /api/examination/class-subject
// @access  Private

const getExamClassSubjects = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "exam_type";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["class"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery({
    ExamClassSubject,
    query,
    page,
    limit,
    sort,
  });

  if (!results) {
    return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  }

  res.status(200).json(results);
});

// @desc    get examClassSubject
// @route   GET /api/examination/class-subject/:id
// @access  Private
const getExamClassSubject = asyncHandler((req, res) => {
  const query = { _id: req.params.id };
  const examClassSubject = ExamClassSubject.findOne(query);
  if (!examClassSubject) {
    res.status(400);
    throw new Error("examClassSubject", req.params.id);
  }

  res.status(200).json(examClassSubject);
});

// @desc    Add examClassSubject
// @route   POST /api/examination/class-subject
// @access  Private
const addExamClassSubject = asyncHandler(async (req, res) => {
  const cls = Classs.find({ name: req.body.class.toUppercase() })
    .select("_id")
    .lean();
  if (!cls) {
    res.status(400);
    throw new Error(C.getResourse404Id("class", req.body.class));
  }

  const sub = Subject.find({ name: req.body.subject.toUppercase() })
    .select("_id")
    .lean();
  if (!sub) {
    res.status(400);
    throw new Error(C.getResourse404Id("subject", req.body.subject));
  }

  const sec = await Section.find({ name: req.body.section.toUppercase() })
    .select("_id")
    .lean();
  if (!sec) {
    res.status(400);
    throw new Error(C.getResourse404Id("section", req.body.section));
  }

  const t = Term.find({ name: req.body.term.toUppercase() })
    .select("_id")
    .lean();
  if (!t) {
    res.status(400);
    throw new Error(C.getResourse404Id("term", req.body.term));
  }

  const examClassSubject = await ExamClassSubject.create({
    class: cls._id,
    section: sec._id,
    subject: sub._id,
    sub_short: req.body.sub_short,
    parent_sub: req.body.parent_sub,
    code: req.body.code,
    sequence: req.body.sequence,
    term: t._id,
    subject_type: req.body.subject_type,
    sub_show: req.body.sub_show,
    sub_min_or_maj: req.body.sub_min_or_maj,
  });
  res.status(200).json(examClassSubject._id);
});

// @desc    update examClassSubject
// @route   PATCH /api/examination/class-subject/:id
// @access  Private

const updateExamClassSubject = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (!(await ExamType.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Id("ExamType", req.params.id));
  }

  const result = await ExamType.updateOne(query, {
    $set: { name: req.body.name },
  });
  res.status(201).json(result);
});

// @desc    delete examClassSubject
// @route   DELETE /api/examination/class-subject/:id
// @access  Private

const deleteExamClassSubject = asyncHandler(async (req, res) => {
  const examClassSubject = ExamClassSubject.findById(req.params.id)
    .select("_id")
    .lean();
  if (!examClassSubject) {
    res.status(400);
    throw new Error(C.getResourse404Error("examClassSubject", req.params.id));
  }

  const delQuery = { _id: req.params.id };

  const deletedExamClassSubject = await ExamClassSubject.deleteOne(delQuery);
  res.status(200).json(deletedExamClassSubject);
});

// 4 examSubjectMarks

// @desc get  examSubjectsMarks
// @route GET /api/examinaion/subject-marks/
// @access private

const getExamSubjectsMarks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "class";
  const search = req.query.search;

  if (!req.body.class) {
    res.status(400);
    throw new Error(C.getFieldIsReq("class"));
  }

  const c = Classs.findOne({ name: req.body.class.toUpperCase() })
    .select("_id")
    .lean();

  if (!c) {
    res.status(400);
    throw new Error(C.getResourse404Id("class", req.body.class));
  }

  if (!req.body.exam_type) {
    res.status(400);
    throw new Error(C.getFieldIsReq("exam period"));
  }

  const per = ExamType.findOne({ name: req.body.exam_type.toUpperCase() })
    .select("_id")
    .lean();

  if (!per) {
    res.status(400);
    throw new Error(C.getResourse404Id("exam period", req.body.exam_type));
  }

  if (!req.body.parent_sub) {
    res.status(400);
    throw new Error(C.getFieldIsReq("parent subject"));
  }

  const sub = Subject.findOne({
    parent_sub: req.body.parent_sub.toUpperCase(),
  })
    .select("_id")
    .lean();

  if (!sub) {
    res.status(400);
    throw new Error(C.getResourse404Id("parent subject", req.body.parent_sub));
  }

  const query = {
    class: c._id,
    exam_type: per._id,
    parent_sub: sub._id,
  };
  const results = await UC.paginatedQuery({
    ExamSubjectMarks,
    query,
    page,
    limit,
    sort,
  });

  res.status(200).json(results);
});

// @desc examsubjectMarks
// @route GET /api/examination/subject-marks/:id
// access Private

const getExamSubjectMarks = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  const results = ExamSubjectMarks.findOne(query);
  if (!results) {
    res.status(400);
    throw new Error(C.getResourse404Id("subjectMark", req.params.id));
  }

  res.status(200).json(results);
});

// @desc add examSubjectMarks
// @route POST /api/examinaion/subject-marks/
// @access private

const addExamSubjectMarks = asyncHandler(async (req, res) => {
  const cls = Classs.find({ name: req.body.class.toUppercase() })
    .select("_id")
    .lean();
  if (!cls) {
    res.status(400);
    throw new Error(C.getResourse404Id("class", req.body.class));
  }

  const period = Term.find({ name: req.body.exam_type.toUppercase() })
    .select("_id")
    .lean();
  if (!period) {
    res.status(400);
    throw new Error(C.getResourse404Id("period", req.body.exam_type));
  }

  const sub = ExamClassSubject.find({
    parent_sub: req.body.parent_sub.toUppercase(),
  })
    .select("_id")
    .lean();
  if (!sub) {
    res.status(400);
    throw new Error(C.getResourse404Id("subject", req.body.parent_sub));
  }

  const examSubMarks = await ExamSubjectMarks.create({
    class: cls._id,
    period: period._id,
    parent_sub: sub._id,
    subject: req.body.subject,
    code: req.body.code,
    sequence: req.body.sequence,
    term: req.body.term,
    subject_type: req.body.subject_type,
    sub_show: req.body.sub_show,
    sub_min_or_maj: req.body.sub_min_or_maj,
  });
  res.status(200).json(examSubMarks._id);
});

// @desc update  examSubjectMarks
// @route Patch /api/examination/subject-marks/
// @access private

const updateExamSubjectMarks = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (!(await ExamSubjectMarks.any(query))) {
    res.status(400);
    throw new Error(C.RESOURSE_404_ID("subject", req.aparams.id));
  }

  const updatedExamSubjectMarks = await ExamSubjectMarks.updateOne({
    query,
    $set: {
      Total_marks: req.body.Total_marks,
      Pass_marks: req.body.Pass_marks,
    },
  });
  res.status(200).json(updatedExamSubjectMarks);
});

// @desc    delete examClassSubjectMarks
// @route   DELETE /api/examination/subject-marks/:id
// @access  Private

const deleteExamSubjectMarks = asyncHandler(async (req, res) => {
  const examSubjectMarks = ExamSubjectMarks.findById(req.params.id)
    .select("_id")
    .lean();
  if (!examSubjectMarks) {
    res.status(400);
    throw new Error(C.getResourse404Error("examSubjectMarks", req.params.id));
  }

  const delQuery = { _id: req.params.id };

  const deletedExamSubjectMarks = await ExamSubjectMarks.deleteOne(delQuery);
  res.status(200).json(deletedExamSubjectMarks);
});

module.exports = {
  addExamType,
  getExamTypes,
  getExamType,
  updateExamType,
  deleteExamtype,

  addExamSchedule,
  getExamSchedules,
  getExamSchedule,
  updateExamShedule,
  deleteExamSchedule,

  addExamClassSubject,
  getExamClassSubjects,
  getExamClassSubject,
  updateExamClassSubject,
  deleteExamClassSubject,

  addExamSubjectMarks,
  getExamSubjectsMarks,
  getExamSubjectMarks,
  updateExamSubjectMarks,
  deleteExamSubjectMarks,
};
