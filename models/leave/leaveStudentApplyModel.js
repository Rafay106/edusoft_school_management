const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const leaveStudentApplySchema = new mongoose.Schema(
  {
    role:{type:ObjectId,required,ref:"hr_staffs"},
    type: { type: String, required, enum: ["c", "F", "E"] }, // "casual","formal","emergency"
    teacher: { type: ObjectId, required, ref: "hr_staffs" },
    l_from: { type: Date, required },
    l_to: { type: Date, required },
    reason: { type: String, required },
    file: { type: String, default: "" },
    status: { type: String, default: "pend" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
leaveStudentApplySchema.plugin(any);
const leaveStudentApply = mongoose.model(
  "leave_student_apply",
  leaveStudentApplySchema
);
module.exports = leaveStudentApply;
