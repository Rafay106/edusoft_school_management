const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const examSubjectMarksSchema = new mongoose.Schema({
  class: { type: ObjectId, required, refs: "academics_classes" },
  exam_type: { type: ObjectId, required, ref: "exam_type" },
  parent_sub: { type: ObjectId, required, refs: "exam_class_subject" },
  subject: { type: ObjectId, required, refs: "academics_subjects" },
  total_marks: { type: Number, required },
  pass_marks: { type: Number, required },
  exam_start: { type: ObjectId, required, refs: "exam_schedule" },
  card_show: { type: Boolean, required },
  is_publish_online: { type: Boolean, required },
});

const ExamSubjectMarks = mongoose.model(
  "exam_subject_marks",
  examSubjectMarksSchema
);

module.exports = ExamSubjectMarks;
