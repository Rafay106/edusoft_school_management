const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const topicSchema = new mongoose.Schema(
  {
    topics: [
      {
        title: { type: String, required, uppercase: true },
        completed_date: { type: Date, default: 0 },
        teacher: { type: ObjectId, ref: "hr_staffs" },
        status: { type: String, default: "" },
      },
    ],
    lesson: { type: ObjectId, required, ref: "lessonplan_lesson" },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { versionKey: false }
);

topicSchema.index({ lesson: 1, "topics.title": 1, academic_year: 1 });
topicSchema.plugin(any);

const Topic = mongoose.model("lessonplan_topic", topicSchema);
module.exports = Topic;
