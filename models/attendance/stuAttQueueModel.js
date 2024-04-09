const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
    msg: { type: String, required: [true, C.FIELD_IS_REQ] },
    dt: { type: Date, default: new Date() },
    student: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "students",
    },
  },
  { versionKey: false }
);

schema.plugin(any);

const QueueStuAtt = mongoose.model(
  "queue_student_attendance",
  schema
);
module.exports = QueueStuAtt;
