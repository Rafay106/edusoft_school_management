const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    type: {
      type: String,
      required,
      enum: {
        values: ["attendance-bus", "attendance-class", "fee", "notice", "misc"],
        message: C.VALUE_NOT_SUP,
      },
    },
    student: { type: ObjectId, required, ref: "students" },
    msg: { type: String, required },
  },
  { timestamps: true, versionKey: false }
);

schema.plugin(any);

const StudentNotification = mongoose.model("student_notifications", schema);
module.exports = StudentNotification;
