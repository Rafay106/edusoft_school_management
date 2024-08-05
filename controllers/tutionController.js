const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Homework = require("../models/tution/homeworksModel");
const HomeworkEvaluation = require("../models/tution/evaluationModel");
const HomeworkSubmission = require("../models/tution/homeworkSubmissionModel");
const Student = require("../models/studentInfo/studentModel");
const Class = require("../models/academics/classModel");
const Section = require("../models/academics/sectionModel");
const Subject = require("../models/academics/subjectModel");
const StudyMaterial = require("../models/tution/StudyMaterialModel");

// @desc    get homeworks
// @route   GET /api/tuition/homework
// @access  Private
const getHomeworks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "class";
  const search = req.query.search;
  const classSectionNames = [req.query.class_section_name];
  const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
    classSectionNames,
    req.ayear
  );

  const subject = await UC.validateSubjectByName(req.query.subject, req.ayear);

  const query = {
    class: classIds,
    subject: subject,
    section: secIds,
  };

  if (search) {
    const fields = [];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  if (!UC.isSchool(req.user)) {
    query.created_by = req.user._id;
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
// @route   POST /api/tuition/homework/
// @access  Private

const addHomework = asyncHandler(async (req, res) => {
  const [classId, secId] = await UC.getClassNSectionIdFromName(
    req.body.class_section_name,
    req.ayear
  );

  const subject = await UC.validateSubjectByName(req.body.subject, req.ayear);

  if (classId.includes(req.user.class) && secId.includes(req.user.section)) {
    // Todo...
  } else {
    const availSubjects = [];
    for (const item of req.user.subjects) {
      if (item.class.equals(classId) && item.section.equals(secId)) {
        availSubjects.push(item.subject);
      }
    }
    if (!availSubjects.find((ele) => ele.equals(subject))) {
      res.status(400);
      throw new Error(
        `Subject ${req.body.subject} not available to logged in Teacher`
      );
    }
  }

  const doc_file = req.file ? req.file.filename : "";

  const homeWork = await Homework.create({
    class: classId,
    subject: subject._id,
    section: secId,
    homework_date: req.body.hw_date,
    submission_date: req.body.sub_date,
    marks: req.body.marks,
    doc_file,
    description: req.body.desc,
    created_by: req.user._id,
    academic_year: req.ayear,
  });

  res.status(201).json({ msg: homeWork._id });
});

//@desc    update homework
//@route   PATCH /api/tuition/homework/:id
//@access   private
const updateHomework = asyncHandler(async (req, res) => {
  const homeworkId = req.params.id;
  const updatedData = req.body;
  if (!(await Homework.any({ _id: homeworkId }))) {
    res.status(404);
    throw new Error(C.getResourse404Error("homework", req.params.id));
  }

  const updatedHomework = await Homework.updateOne(
    { _id: homeworkId },
    updatedData
  );
  res.status(200).json(updatedHomework);
});

//@desc   Delete a homework
//@route  DELETE /api/tuition/homework/:id
//@access Private
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

//@desc add homework submission
//@route POST api/tuition/homework/evaluation
//@access private
const addEvaluataion = asyncHandler(async (req, res) => {
  const st = await UC.validateStudentById(req.body.student, req.ayear);
  const homework = await UC.validateHomeworkById(req.body.homework, req.ayear);

  const doc = req.file ? req.file.filename : " ";
  const evaluation = await HomeworkEvaluation.create({
    student: st,
    homework,
    marks: req.body.marks,
    comments: req.body.comments,
    status: req.body.status,
    file: doc,
  });

  res.status(201).json({ msg: evaluation._id });
});

//@desc update evaulation
//@route PATCH api/tuition/homework/evaluation
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
//@route DELETE api/tuition/homework/evaluation/:id
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
// @route   POST /api/tuition/homework/report
// @access  Private
const getHomeworkReportList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "homework_date";
  const search = req.query.search;

  const c = await UC.validateClassByName(req.body.class, req.ayear);
  const subject = await UC.validateSubjectByName(req.body.subject, req.ayear);
  const section = await UC.validateSectionByName(req.body.section, req.ayear);
  const hwDate = UC.validateAndSetDate(req.body.homework_date, "homework_date");

  // if (!req.body.homeworkDate) {
  //   res.status(400);
  //   throw new Error(C.getFieldIsReq("homeworkDate"));
  // }

  // const date = new Date(req.body.homeworkDate);

  // if (isNaN(date)) {
  //   res.status(400);
  //   throw new Error(C.getFieldIsInvalid("homeworkDate"));
  // }

  const query = {
    class: c,
    section: section,
    subject: subject,
    homework_date: hwDate,
  };
  const homeworkList = await Homework.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort(sort)
    .lean();

  if (!homeworkList.length) {
    return res.status(400).json({ msg: C.getResourse404("homework") });
  }

  const homeworkIds = homeworkList.map((hw) => hw._id);
  const evaluations = await HomeworkEvaluation.find({
    homework: { $in: homeworkIds },
  }).lean();
  const homeworkData = await homeworkList.map((hw) => {
    const evaluation = evaluations.find(
      (ev) => ev.homework.toString() === hw._id.toString()
    );
    return {
      ...hw,
      marks: evaluation ? evaluation.marks : null,
    };
  });
  res.status(200).json(homeworkData);
});

// study-material
// @desc    get study materials
// @route   GET /api/tution/study-material
// @access  Private
const getStudyMaterials = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "class";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["teacher", "class", "section"];
    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    StudyMaterial,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    get study material
// @route   GET /api/tution/study-material/:id
// @access  Private

const getStudyMaterial = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const studyMaterial = await StudyMaterial.findOne(query).lean();

  if (!studyMaterial) {
    res.status(404);
    throw new Error(C.getResourse404Id("studyMaterial", req.params.id));
  }

  res.status(200).json(studyMaterial);
});

// study-material
// @desc    add study material
// @route   POST /api/tution/study-material
// @access  Private
const addStudyMaterial = async (req, res) => {
  const clsId = await UC.validateClassByName(req.body.class_name, req.ayear);
  const secId = await UC.validateSectionByName(req.body.section, req.ayear);

  const doc = req.file ? req.file.filename : " ";

  const studyMaterial = await StudyMaterial.create({
    teacher: req.body.teacher,
    class: clsId,
    section: secId,
    document: doc,
    content: req.body.content,
    url: req.body.url,
  });
  res.status(201).json({ msg: studyMaterial._id });
};

// @desc    update study material
// @route   PATCH /api/tution/study-material/:id
// @access  Private
const updateStudyMaterial = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await StudyMaterial.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("studyMaterial", req.params.id));
  }

  const result = await StudyMaterial.updateOne(query, {
    $set: {
      document: req.body.document,
      content: req.body.content,
      url: req.body.url,
    },
  });
  res.status(200).json(result);
});
// @desc    delete study material
// @route   DELETE /api/tution/study-material/:id
// @access  Private
const deleteStudyMaterial = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const studyMaterial = await StudyMaterial.findOne(query).select("_id").lean();

  if (!studyMaterial) {
    res.status(400);
    throw new Error(C.getResourse404Id("studyMaterial", req.params.id));
  }
  const result = await StudyMaterial.deleteOne(query);

  res.status(200).json(result);
});

module.exports = {
  addHomework,
  getHomeworks,
  updateHomework,
  deleteHomework,

  addEvaluataion,
  updateEvaluation,
  deleteEvaluation,

  getHomeworkReportList,

  addStudyMaterial,
  getStudyMaterials,
  getStudyMaterial,
  updateStudyMaterial,
  deleteStudyMaterial,
};
