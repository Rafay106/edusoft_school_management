const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const subjectSchema = new mongoose.Schema(
  {
    class: { type: ObjectId, required, ref: "academics_classes" },
    section: { type: ObjectId, required, ref: "academics_sections" },
    subject: { type: ObjectId, required, ref: "academics_subjects" },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    teacher: { type: ObjectId, required, ref: "hr_staffs" },
    class: { type: ObjectId, required, ref: "academics_classes" },
    section: { type: ObjectId, required, ref: "academics_sections" },
    subjects: [subjectSchema],
    academic_year: { type: ObjectId, required, ref: "academic_years" },
  },
  { timestamps: true, versionKey: false }
);

schema.index(
  { class: 1, section: 1, teacher: 1, academic_year: 1 },
  { unique: true }
);
schema.plugin(any);

const ClassTeacherAssign = mongoose.model(
  "academics_assign_class_teachers",
  schema
);
module.exports = ClassTeacherAssign;
