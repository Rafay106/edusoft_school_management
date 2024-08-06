const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const attendanceTypeSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required,
      enum: { values: [C.ENTRY, C.EXIT], message: C.VALUE_NOT_SUP },
    },
    time: { type: Date, required },
    msg: { type: String, required },
    mark_as_absent: { type: Boolean, default: false },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    date: { type: Date, required },
    student: { type: ObjectId, required, ref: "students" },
    list: [attendanceTypeSchema],
  },
  { timestamps: true, versionKey: false }
);

schema.index({ date: 1, student: 1 }, { unique: true });

schema.pre("save", function (next) {
  if (this.date) this.date = new Date(this.date).setUTCHours(0, 0, 0, 0);
  next();
});

schema.pre("updateOne", function (next) {
  this.setOptions({ runValidators: true });
  next();
});

schema.plugin(any);

const StuClassAtt = mongoose.model("attendance_class_students", schema);
module.exports = StuClassAtt;
