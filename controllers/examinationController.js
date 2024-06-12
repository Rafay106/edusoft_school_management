const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");

const ExamType = require("../models/examination/examtypeModel");
const ExamSchedule = require("../models/examination/examScheduleModel");

// @desc    Add examtype
// @route   POST /api/examtype/
// @access  Private

const addExamType = asyncHandler(async (req, res) => {
  const examType = await ExamType.create({
    name: req.body.name,
    school: req,
    school,
    academic_year: req.ayear,
  });
  res.status(200).json({ msg: examType._id });
});

// @desc    get examtypes
// @route   GET /api/examtype/
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

    //  const results = await ExamType.find();
    const results = await UC.paginatedQuery(
      ExamType,
      query,
      {},
      page,
      limit,
      sort
    );
  }
  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  console.log(results);
  res.status(200).json(results);
});

// @desc    get examtype
// @route   GET /api/examtype/:id
// @access  Private

const getExamType = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  const examType = await ExamType.findOne(query).lean();

  if (!examType) {
    res.status(400);
    throw new Error(C.getResourse404Id("examType", req.params.id));
  }

  res.status(201).json(examType);
});

// @desc    update examtwype
// @route   PATCH /api/examtype/:id
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
    query["$or"] = searchQuery["$or"];
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
  const examSchedule = await ExamSchedule.findOne(query);
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
  const exType = await ExamType.findOne({
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

// @desc    Add examClassSubject
// @route   POST /api/examination/class-subject
// @access  Private

  const addExamClassSubject = asyncHandler(async(req,res)=>{
      

  })
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
};
