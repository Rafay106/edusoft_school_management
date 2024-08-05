const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Class = require("../models/academics/classModel");
const Lesson = require("../models/lesson_plan/lessonModel");
const Section = require("../models/academics/sectionModel");
const Subject = require("../models/academics/subjectModel");
const Topic = require("../models/lesson_plan/topicModel");
const Staff = require("../models/hr/staffModel");
const LessonPlan = require("../models/lesson_plan/lessonplanModel");

// @desc    get lessons
// @route   GET /api/lesson/
// @access  Private

const getLessons = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "class";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["class ", "section"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }
  const results = await UC.paginatedQuery(
    Lesson,
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

// @desc    Get a lesson
// @route   GET /api/lesson/:id
// @access  Private
const getLesson = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const lesson = await Lesson.findOne(query);
  if (!lesson) {
    res.status(400);
    throw new Error(C.getResourse404Id("lesson", req.params.id));
  }
  res.status(200).json(lesson);
});

// @desc    Add lesson
// @route   POST /api/lesson/
// @access  Private
const addLesson = asyncHandler(async (req, res) => {
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

  const lesson = await Lesson.create({
    class: c._id,
    subject: subject._id,
    name: req.body.name,
    school: req.school,
    academic_year: req.ayear,
  });
  res.status(201).json({ msg: lesson._id });
});

// @desc    update a lesson
// @route   PATCH /api/lesson/:id
// @access  Private
const updateLesson = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await Lesson.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("Lesson", req.params.id));
  }

  const updatedLesson = await Lesson.updateOne(query, {
    $set: { name: req.body.name },
  });

  res.status(200).json(updatedLesson);
});

// @desc    delete a subject
// @route   DELETE /api/lesson/:id
// @access  Private
const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).select("_id").lean();
  if (!lesson) {
    res.status(400);
    throw new Error(C.getResourse404Id("lesson", req.params.id));
  }
  const delQuery = { _id: req.params.id };
  const result = await Lesson.deleteOne(delQuery);

  res.status(200).json(result);
});

// @desc    Get all Topics
// @route   GET /api/lesson/topic
// @access  Private
const getTopics = asyncHandler(async (req, res) => {
  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.rows) || 10;
  // const sort = req.query.sort || "title" || "name";
  // const searchField = "all";
  // const search = req.query.search;

  // const query = {};

  // if (search) {
  //   const fields = ["class", "subject", "lesson", "topic"];

  //   const searchQuery = UC.createSearchQuery(fields, search);
  //   query["$or"] = searchQuery;
  // }
  // const results = await UC.paginatedQuery(Topic, query, {}, page, limit, sort);

  // if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  // res.status(200).json(results);

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "topics.title";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["topics.title", "topics.content"];

    const searchQuery = {
      $or: fields.map((field) => ({
        [field]: { $regex: search, $options: "i" },
      })),
    };

    query["$or"] = searchQuery;
  }

  try {
    const results = await Topic.find(query)
      .populate("lesson")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sort);

    const total = await Topic.countDocuments(query);

    res.status(200).json({
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalItems: total,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get a topic
// @route   GET /api/topic/:id
// @access  Private
const getTopic = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const topic = await Topic.findOne(query);
  if (!topic) {
    res.status(400);
    throw new Error(C.getResourse404Id("topic", req.params.id));
  }
  res.status(200).json(topic);
});

// @desc    Add topic
// @route   POST /api/lesson/topic
// @access  Private
const addTopic = asyncHandler(async (req, res) => {
  const c = await UC.validateClassByName(req.body.class, req.ayear);

  const section = await UC.validateSectionByName(req.body.section, req.ayear);

  const subject = await UC.validateSubjectByName(req.body.subject, req.ayear);

  if (!req.body.lesson) {
    res.status(400);
    throw new Error(C.getFieldIsReq("lesson"));
  }

  const l = await Lesson.findOne({
    name: req.body.lesson.toUpperCase(),
  })
    .select("_id")
    .lean();

  if (!l) {
    res.status(400);
    throw new Error(C.getResourse404Id("lesson", req.body.lesson));
  }

  const topic = await Topic.create({
    class: c._id,
    subject: subject._id,
    section: section._id,
    lesson: l._id,
    topics: req.body.topics,
    academic_year: req.ayear,
    school: req.school._id,
  });

  res.status(201).json({ msg: topic._id });
});

// @desc    update a topic
// @route   PATCH /api/lesson/topic
// @access  Private
const updateTopic = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await Topic.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("LessonTopic", req.params.id));
  }

  const updatedTopic = await Topic.updateOne(query, {
    $set: { title: req.body.title },
  });

  res.status(200).json(updatedTopic);
});

// @desc    delete a topic
// @route   DELETE /api/lesson/topic
// @access  Private
const deleteTopic = asyncHandler(async (req, res) => {
  const topic = await Topic.findById(req.params.id).select("_id").lean();
  if (!topic) {
    res.status(400);
    throw new Error(C.getResourse404Id("topic", req.params.id));
  }

  const delQuery = { _id: req.params.id };
  const result = await Topic.deleteOne(delQuery);
  res.status(200).json(result);
});

// @desc    Get a topicOverview
// @route   GET /api/topicOverview
// @access  Private

const getTopicOverview = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "class";

  const c = await UC.validateClassByName(req.body.class);
  const section = await UC.validateSectionByName(req.body.section);
  const subject = await UC.validateSubjectByName(req.body.subject);
  const query = {
    class: c._id,
    section: section._id,
    subject: subject._id,
  };
  const topicOverview = await Topic.find(query)
    .select(
      "lesson topics.title topics.completed_date topics.teacher topics.status"
    )
    .skip((page - 1) * limit)
    .limit(limit)
    .sort(sort)
    .lean();

  if (!topicOverview) {
    res.status(400);
    throw new Error("topicOverview", req.body.topicOverview);
  }
  res.status(200).json({ msg: topicOverview._id });
});
// @desc    Add lessonplan
// @route   POST /api/lessonplan
// @access  Private

const addLessonPlan = asyncHandler(async (req, res) => {
  const file = req.file ? req.file.filename : " ";

  const t = await Staff.find({ _id: req.body.teacher }).select("_id").lean();

  if (!t) {
    res.status(400);
    throw new Error(C.getResourse404Id("teacher", req.body.teacher));
  }

  const lesson = await UC.validateLessonByName(req.body.lesson);

  const topics = [];
  for (const t of req.body.topics) {
    const lessonTopic = await Topic.findOne({ "topics.title": t.topic });
  }

  const lessonPlan = await LessonPlan.create({
    teacher: t._id,
    class_routine: req.body.class_routine,
    lesson: lesson._id,
    topics: req.body.topics,
    url: req.body.url,
    file,
    note: req.body.note,
    academic_year: req.ayear,
    school: req.school,
  });
  res.status(200).json({ msg: lessonPlan._id });
});

// @desc    get lessonplan
// @route   GET /api/lessonplan
// @access  Private

// const getLessonPlan = asyncHandler(async(req,res)=>{
//     const page = parseInt(req.query.page)||1;
//     const limit = parseInt(req.query.rows)||10;
//     const sort = req.query.sort ||"teacher";
//     const search = req.query.search;

//     const teacher = await UC.validateTeacherByName(req.body.teacher);
//     const query = teacher._id;
//     const lessonPlan = LessonPlan.find(query)
//                         .skip((page-1)*limit)
//                         .limit(limit)
//                         .sort(sort)
//                         .lean();

// })
module.exports = {
  addLesson,
  getLessons,
  getLesson,
  updateLesson,
  deleteLesson,

  addTopic,
  getTopics,
  getTopic,
  updateTopic,
  deleteTopic,

  addLessonPlan,

  getTopicOverview,
};
