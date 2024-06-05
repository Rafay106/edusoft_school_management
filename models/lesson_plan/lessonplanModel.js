const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const topicplanSchema = new mongoose.Schema(
  {
    teacher: { type: ObjectId, ref: "hr_staffs" },
    class_routine: { type: ObjectId, required, ref: "academic_classRoutine" },
    lesson: { type: ObjectId, required, ref: "lessonplan_lesson" },
    topics: [
      {
        topic: { type: ObjectId, required, refs: "lessonplan_topic" },
        subTopic: { type: String, required },
      },
    ],
    url: { type: String, default: "" },
    file: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);
topicplanSchema.plugin(any);

const LessonPlan = mongoose.model("lessonplan_lessonplan", topicplanSchema);
module.exports = LessonPlan;
