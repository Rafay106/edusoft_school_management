const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const lessonSchema = new mongoose.Schema(
  {
    name: { type: String, required, uppercase: true },
    class: { type: ObjectId, required, ref: "academics_classes" },
    subject: { type: ObjectId, required, ref: "academics_subjects" },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { versionKey: false }
);

lessonSchema.index({ name: 1, class: 1, subject: 1, academic_year: 1 });
lessonSchema.plugin(any);

const Lesson = mongoose.model("lessonplan_lesson", lessonSchema);
module.exports = Lesson;
