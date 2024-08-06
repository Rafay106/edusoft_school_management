const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Homework = require("../models/homework/homeworksModel");
const HomeworkEvaluation = require("../models/homework/evaluationModel");
const Student = require("../models/studentInfo/studentModel");

const Class = require("../models/academics/classModel");
const Section = require("../models/academics/sectionModel");
const Subject = require("../models/academics/subjectModel");

// @desc    get homeworks
// @route   GET /api/homework
// @access  Private
const getHomeworkList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "class";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["class ", "section"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    Homework,
    query,
    {},
    page,
    limit,
    sort,
    ["class subject section", "name"]
  );

  if (!results) {
    return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  }

  res.status(200).json(results);
});

// @desc    Add homework
// @route   POST /api/homework/
// @access  Private
const addHomework = asyncHandler(async (req, res) => {
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

  const doc_file = req.file ? req.file.filename : "";

  const homeWork = await Homework.create({
    class: c._id,
    subject: subject._id,
    section: section._id,
    homework_date: req.body.hw_date,
    submission_date: req.body.sub_date,
    marks: req.body.marks,
    doc_file,
    description: req.body.desc,
    academic_year: ayear,
    school: req.school,
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

  if (!(await Homework.any(homeworkId))) {
    res.status(404);
    throw new Error(C.getResourse404Error("homework", req.params.id));
  }
  const updatedHomework = await Homework.updateOne(
    { _id: homeworkId },
    updatedData
  );
  res.status(200).json(updatedHomework);
});

//@desc delete homework
//@route DELETE .api/homework/:id
//@access private
const deleteHomework = asyncHandler(async (req, res) => {
  const homework = Homework.findById(req.params.id).select("_id").lean();
  if (!homework) {
    res.status(400);
    throw new Error(C.getResourse404Error("homework", req.params.id));
  }
  const delQuery = { _id: req.params.id };

  const deletedHomework = await Homework.deleteOne(delQuery);
  res.status(200).json(deletedHomework);
});

//@desc add evaulation
//@route POST api/homework/evaluation
//@access private
const addEvaluataion = asyncHandler(async (req, res) => {
  const ayear = await UC.getCurrentAcademicYear(req.school);

  if (!req.body.student) {
    res.status(400);
    throw new Error(C.getFieldIsReq("student"));
  }

  if (!(await Student.any({ _id: req.body.student }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("student", req.body.student));
  }

  if (!req.body.homework) {
    res.status(400);
    throw new Error(C.getFieldIsReq("homework"));
  }

  if (!(await Homework.any({ _id: req.body.homework }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("homework", req.body.homework));
  }

  const evaluation = await HomeworkEvaluation.create({
    student: req.body.student,
    homework: req.body.homework,
    marks: req.body.marks,
    comments: req.body.comments,
    status: req.body.status,
    file: "", // TODO
    academic_year: ayear,
    school: req.school,
  });

  res.status(201).json({ msg: evaluation._id });
});

//@desc update evaulation
//@route PATCH api/homework/evaluation
//@access private
// const updateEvaluation = asyncHandler(async (req, res) => {
//   const evaluationId = req.params.id;
//   const updatedData = req.body;
//

//   if (!(await HomeworkEvaluation.any(evaluationId))) {
//     res.status(404);
//     throw new Error(C.getResourse404Error("homeworkEvaluation", req.params.id));
//   }

//   const updatedEvaluation = await HomeworkEvaluation.updateOne(
//     { _id: evaluationId },
//     { $set: updatedData }
//   );

//   res.status(200).json(updatedEvaluation);
// });
const updateEvaluation = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await HomeworkEvaluation.any(query))) {
    res.status(404);
    throw new Error(C.getResource404Error("HomeworkEvaluation", req.params.id));
  }

  const update = await HomeworkEvaluation.updateOne(query, {
    $set: {
      marks: req.body.marks,
      comments: req.body.comments,
      status: req.body.status,
    },
  });

  res.status(200).json(update);
});

//@desc delete evaluation
//@route DELETE api/homework/evaluation/:id
//@access private
const deleteEvaluation = asyncHandler(async (req, res) => {
  const evaluation = Homework.findById(req.params.id).select("_id").lean();
  if (!evaluation) {
    res.status(400);
    throw new Error(C.getResourse404Error("evaluation", req.params.id));
  }
  const delQuery = { _id: req.params.id };

  const deletedEvaluation = await HomeworkEvaluation.deleteOne(delQuery);
  res.status(200).json(deletedEvaluation);
});

// @desc    get homeworkReport
// @route   POST /api/homework/report
// @access  Private
const getHomeworkReportList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "homework_date";

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

  if (!req.body.homeworkDate) {
    res.status(400);
    throw new Error(C.getFieldIsReq("homeworkDate"));
  }

  const date = new Date(req.body.homeworkDate);

  if (isNaN(date)) {
    res.status(400);
    throw new Error(C.getFieldIsInvalid("homeworkDate"));
  }

  const query = {
    class: c._id,
    section: section._id,
    subject: subject._id,
    homework_date: date,
  };
  const homeworkList =await Homework.find(query)
  .skip((page-1)*limit)
  .limit(limit)
  .sort(sort)
  .lean();
    
  if(!homeworkList.length){
       return res.status(400).json({msg:C.getResourse404("homework")});
  }
  const homeworkIds =  homeworkList.map(hw =>hw._id);
  const evaluations =   await HomeworkEvaluation.find({homework :{ $in : homeworkIds}}).lean();
  const  homeworkData = await homeworkList.map(hw =>{
    const evaluation =  evaluations.find(ev =>ev.homework.toString()=== hw._id.toString());
    return {
        ...hw,
        marks:evaluation? evaluation.marks:null
    }
  });
res.status(200).json(homeworkData);
});
  
module.exports = {
  addHomework,
  getHomeworkList,
  updateHomework,
  deleteHomework,
  addEvaluataion,
  updateEvaluation,
  deleteEvaluation,

  getHomeworkReportList
};
