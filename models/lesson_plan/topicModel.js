const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const topicSchema = new mongoose.Schema(
  {
    class: { type: ObjectId, required, ref: "academics_classes" },
    section: { type: ObjectId, required, ref: "academics_sections" },
    subject: { type: ObjectId, required, ref: "academics_subjects" },
    lesson: { type: ObjectId, required, ref: "lessonplan_lesson" },
    topics: [
      {
        title: { type: String, required },
        completed_date: { type: Date, default: 0 },
        teacher: { type: ObjectId, ref: "hr_staffs" },
        status: { type: String, default: "" },
      },
    ],
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { versionKey: false }
);

topicSchema.plugin(any);

const Topic = mongoose.model("lessonplan_topic", topicSchema);
module.exports = Topic;
