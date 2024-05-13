const HomeWork = require("../models/homework/homeworksModel");
const Evaluation = require("../models/homework/evaluationModel");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Student = require("../models/studentInfo/studentModel");

const { query } = require("express");

// @desc    get homeworks
// @route   GET /api/homework
// @access  Private
const getHomeworkList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "class";
  const search = req.query.search;

  const query = {};

  if (C.isSchool(req.user.type)) query.school = req.user.school;

  if (search) {
    const fields = ["class ", "section"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }
  let results = await UC.paginatedQuery(HomeWork, query, {}, page, limit, sort);

  if (!results) {
    res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  } else {
    res.status(200).json(results);
  }
});

// @desc    Add homework
// @route   POST /api/homework/
// @access  Private
const addHomework = asyncHandler(async (req, res) => {
  const school = await UC.validateSchool(req.user, req.body.school);
  const ayear = await UC.getCurrentAcademicYear(school);

  const homeWork = await HomeWork.create({
    class: req.body.class,
    subject: req.body.subject,
    section: req.body.section,
    homework_date: req.body.homework_date,
    submission_date: req.body.submission_date,
    marks: req.body.marks,
    attach_file: req.body.attach_file,
    description: req.body.description,
    academic_year: ayear,
    school,
  });
  res.status(201).json({ msg: homeWork._id });
});
//@desc    update homework
//@route   PATCH /api/homework/:id
//@access   private

const updateHomework = asyncHandler(async (req, res) => {
  const homeworkId = req.params.id;
  const updatedData = req.body;
  const query = {};
  if (C.isSchool(req.user.type)) query.school = req.user.school;

  if (!(await HomeWork.any(homeworkId))) {
    res.status(404);
    throw new Error(C.getResourse404Error("homework", req.params.id));
  }
  const updatedHomework = await HomeWork.updateOne(
    { _id: homeworkId },
    updatedData
  );
  res.status(200).json(updatedHomework);
});

//@desc delete homework
//@route DELETE .api/homework/:id
//@access private
const deleteHomework = asyncHandler(async (req, res) => {
  const homework = HomeWork.findById(req.params.id).select("_id").lean();
  if (!homework) {
    res.status(400);
    throw new Error(C.getResourse404Error("homework", req.params.id));
  }
  const delQuery = { _id: req.params.id };
  if (C.isSchool(req.user.type)) query.school = req.user.school;

  const deletedHomework = await HomeWork.deleteOne(delQuery);
  res.status(200).json(deletedHomework);
});
//@desc add evaulation
//@route POST api/homework/evaluation
//@access private
const addEvaluataion = asyncHandler(async (req, res) => {
  const school = await UC.validateSchool(req.user, req.user.school);
  const ayear = await UC.getCurrentAcademicYear(school);

  const evaluation = await Evaluation.create({
    student: req.body.student,
    section: req.body.section,
    homework: req.body.homework,
    marks: req.body.marks,
    comments: req.body.comments,
    status: req.body.status,
    download: req.body.download,
    academic_year: ayear,
    school,
  });
});
//@desc update evaulation
//@route PATCH api/homework/evaluation
//@access private
// const updateEvaluation = asyncHandler(async (req, res) => {
//   const evaluationId = req.params.id;
//   const updatedData = req.body;
//   if (C.isSchool(req.user.type)) query.school = req.user.school;

//   if (!(await Evaluation.any(evaluationId))) {
//     res.status(404);
//     throw new Error(C.getResourse404Error("homeworkEvaluation", req.params.id));
//   }

//   const updatedEvaluation = await Evaluation.updateOne(
//     { _id: evaluationId },
//     { $set: updatedData }
//   );

//   res.status(200).json(updatedEvaluation);
// });
const updateEvaluation = asyncHandler(async (req, res) => {
  const evaluationId = req.params.id;
  const updatedData = req.body;
  const query = {};

  if (C.isSchool(req.user.type)) {
    query.school = req.user.school;
  }

  const evaluationExists = await Evaluation.any(evaluationId);
  if (!evaluationExists) {
    res.status(404);
    throw new Error(C.getResource404Error("homeworkEvaluation", req.params.id));
  }

  const updatedEvaluation = await Evaluation.findOneAndUpdate(
    { _id: evaluationId },
    { $set: updatedData },
    { new: true }
  );

  res.status(200).json(updatedEvaluation);
});

//@desc delete evaluation
//@route DELETE api/homework/evaluation/:id
//@access private
const deleteEvaluation = asyncHandler(async (req, res) => {
  const evaluation = HomeWork.findById(req.params.id).select("_id").lean();
  if (!evaluation) {
    res.status(400);
    throw new Error(C.getResourse404Error("evaluation", req.params.id));
  }
  const delQuery = { _id: req.params.id };
  if (C.isSchool(req.user.type)) query.school = req.user.school;

  const deletedEvaluation = await Evaluation.deleteOne(delQuery);
  res.status(200).json(deletedEvaluation);
});
// @desc    add evaluationReport
// @route   POST /api/homework/Report
// @access  Private
const addEvaluationReport = asyncHandler(async (req, res) => {
  const school = await UC.validateSchool(req.user, req.body.school);
  const ayear = await UC.getCurrentAcademicYear(school);

  const report = await EvaluationReport.create({
    name: req.body.name,
    class: req.body.class,
    subject: req.body.subject,
    marks: req.body.marks,
    submission_date: req.body.submission_date,
    evaluation_date: req.body.evaluation_date,
    school,
    academic_year: ayear,
  });

  res.status(200).json({ msg: report._id });
});

// @desc    get homeworkReport
// @route   get /api/homework/Report
// @access  Private
const getHomeworkReport = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "class";
  const searchField = "all";
  const search = req.query.search || "class";
  const class_ = req.query.class;
  const subject = req.query.subject;
  const section = req.query.section;
  let query = {};
  if (!class_) {
    res.status(400);
    throw new Error(C.getFieldIsReq("class"));
  }
  if (!subject) {
    res.status(400);
    throw new Error(C.getFieldIsReq("subject"));
  }
  if (!section) {
    res.status(400);
    throw new Error(C.getFieldIsReq("section"));
  }
  if (!req.query.date) {
    res.status(400);
    throw new Error(C.getFieldIsReq("date"));
  }

  const date = new Date(req.query.date);

  if (isNaN(date)) {
    res.status(400);
    throw new Error(C.getFieldIsInvalid("date"));
  }

  if (C.isSchool(req.user.type)) query.school = req.user.school;
  if (search) {
    if (searchField === "all") {
      const fields = ["name"];
      const searchQuery = UC.createSearchQuery(fields, search);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery(fields, search);
      query["$or"] = saarchQuery["$or"];
    }
    query = {
      class: class_,
      section,
      subject,
      submission_date: new Date(date.setUTCHours(0, 0, 0, 0)),
    };
    const results = await HomeWork.find(query)
      .populate({
        path: "Evaluation",
        select: "marks evaluation_date",
      })
      .select("name class subject section submission_date")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    console.log(query);
    console.log("results", results);

    // const results = await UC.paginatedQuery(
    //   evaluationReport,
    //   query,
    //   {},
    //   page,
    //   limit,
    //   sort
    // );
    if (!results) {
      res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
    } else {
      res.status(200).json(results);
    }
  }
});

module.exports = {
  addHomework,
  getHomeworkList,
  updateHomework,
  deleteHomework,
  addEvaluataion,
  addEvaluationReport,
  updateEvaluation,
  deleteEvaluation,

  getHomeworkReport,
};
