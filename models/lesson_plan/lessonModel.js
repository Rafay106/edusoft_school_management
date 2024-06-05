const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const lessonSchema = new mongoose.Schema(
  {
    class: { type: ObjectId, required, ref: "academics_classes" },
    subject: { type: ObjectId, required, ref: "academics_subjects" },
    section: { type: ObjectId, required, ref: "academics_sections" },
    name: { type: String, required, uppercase: true },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { versionKey: false }
);

lessonSchema.plugin(any);

const Lesson = mongoose.model("lessonplan_lesson", lessonSchema);
module.exports = Lesson;
