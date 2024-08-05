const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const required = [true, C.FIELD_IS_REQ];
const ObjectId = mongoose.SchemaTypes.ObjectId;


const examClassSubjectSchema = new mongoose.Schema(
  {
    class: { type: ObjectId, required, ref: "academics_classes" },
    section: { type: ObjectId, required, ref: "academics_sections" },
    subject: { type: ObjectId, required, ref: "academics_subjects" },
    sub_short: { type: String, required, upperCase: true },
    parent_sub: { type: String, required },
    code: { type: String, required },
    sequence: { type: Number, required },
    term: { type: ObjectId, required, ref: "" },
    subject_type: { type: String, required, enum: ["none", "optional"] },
    sub_show: { type: Boolean, required },
    sub_min_or_maj: { type: String, required, enum: ["minor", "major"] },
  },
  { versionKey: false, timestamps: true }
);
examClassSubjectSchema.plugin(any);

const ExamClassSubject = mongoose.model(
  "exam_class_subject",
  examClassSubjectSchema
);
module.exports = ExamClassSubject;
