const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const required = [true, C.FIELD_IS_REQ];

const shiftPlanSchema = new mongoose.Schema({
  shift: { type: ObjectId, required, ref: "hr_shifts" },
  rule: { type: ObjectId, required, ref: "hr_shiftPlan_rule" },
  leave_policies:{type:ObjectId,required, ref:""},
  effective_from: { type: Date, required },
  access: { type: ObjectId, required, ref: "hr_departments" },
  repeat: { type: String, required },
  choose_oneShift_from_multipleShift: { type: Boolean, default: false },
  isOneShift_or_isMultipleShift: {
    name: { type: ObjectId, required, ref: "hr_shifts" },
    days: {
      type: String,
      default: "",
      enum: {
        values: ["sun", "mon", "tues", "wed", "thurs", "fri", "sat"],
        message: C.VALUE_NOT_SUP
      }
    },
    weekly_off: { type: [Boolean], default: [false] },
    status: {
      type: String,
      required,
      enum: {
        values: [C.ABSENT, C.PRESENT],
        message: C.VALUE_NOT_SUP
      }
  }
}
},{
  timestamps: true,
  versionKey: false
}
);

shiftPlanSchema.plugin(any);

const ShiftPlan = mongoose.model("hr_shiftPlan", shiftPlanSchema);
module.exports = ShiftPlan;
