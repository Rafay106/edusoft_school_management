const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const examScheduleSchema = new mongoose.Schema(
  {
    exam_type: { type: ObjectId, required, ref: "exam_type" },
    exam_start: { type: Date, required },
    exam_end: { type: Date, required },
    attendance_start: { type: Date, required },
    attendance_end: { type: Date, required },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);
examScheduleSchema.plugin(any);

const ExamSchedule = mongoose.model("exam_schedule", examScheduleSchema);
module.exports = ExamSchedule;
