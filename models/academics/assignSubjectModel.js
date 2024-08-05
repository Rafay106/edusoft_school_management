const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const assignSubjectSchema = new mongoose.Schema(
  {
    class: { type: ObjectId, required, ref: "academics_classes" },
    section: { type: ObjectId, required, ref: "academics_sections" },
    subject: { type: ObjectId, required, ref: "academics_subjects" },
    teacher: { type: ObjectId, required, ref: "hr_staffs" },
  },
  { timestamps: true, versionKey: false }
);

assignSubjectSchema.plugin(any);

const AssignSubject = mongoose.model(
  "academics_assign_subject",
  assignSubjectSchema
);
module.exports = AssignSubject;
