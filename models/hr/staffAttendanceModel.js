const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];
const attendanceSchema = new mongoose.Schema(
  {
    staff: { type: ObjectId, ref: "staffs" },
    attendance_date: { type: String, required },
    mark_holiday: { type: String, enum: ["H", "NH"] },
    attendance: {
      value: {
        type: String,
        enum: ["P", "L", "A"],
        message: C.VALUE_NOT_SUP,
      },
    },
    note: { type: String, default: "HOLIDAY" },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);
attendanceSchema.plugin(any);

const staffAttendance = mongoose.model("staff_attendances", attendanceSchema);
module.exports = staffAttendance;
