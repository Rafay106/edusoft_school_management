const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
    msg: { type: String, required: [true, C.FIELD_IS_REQ] },
    date: { type: Date, required: [true, C.FIELD_IS_REQ] },
    dt: { type: Date, default: new Date() },
    student: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "students",
    },
    bus: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "buses" },
  },
  { versionKey: false }
);

schema.plugin(any);

const StuAttEvent = mongoose.model("student_attendance_event", schema);
module.exports = StuAttEvent;
