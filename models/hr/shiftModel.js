const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const { timeValidator } = require("../../utils/validators");

const timingErr = (props) => {
  return `${props.path}: '${props.value}' is not a valid 24-hour time format (HH:MM)!`;
};

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];
const validate = { validator: timeValidator, message: timingErr };

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required,
      enum: {
        values: [
          C.MORNING_SHIFT,
          C.FLEXI_SHIFT,
          C.EVENING_SHIFT,
          C.NIGHT_SHIFT,
          C.AFTERNOON_SHIFT,
        ],
        message: C.VALUE_NOT_SUP,
      },
    },
    type: {
      type: String,
      required,
      enum: { values: [C.FIXED, C.FLEXIBLE], message: C.VALUE_NOT_SUP },
    },
    fixed: {
      clock_in_time: { type: String, default: "", validate },
      clock_out_time: { type: String, default: "", validate },
      no_of_hours:{type:Number,required,},
      grace_period: { type: Boolean, default: "no", enum: ["no", "yes"] },
      after_shift_start: { type: String, default: "", validate },
      before_shift_ends: { type: String, default: "", validate },
      overtime_allowed:{type:Boolean,required}
    },
    flexible: {
      core_hours: {
        type: Boolean,
        default: "no",
        enum: { values: [C.YES, C.NO], message: C.VALUE_NOT_SUP },
      },
      core_start_time: { type: String, default: "", validate },
      core_end_time: { type: String, default: "", validate },
      break_time_start: { type: String, default: "", validate },
      break_time_end: { type: String, default: "", validate },
    },
    duration: { type: String, required, validate },
    full_day_min_hours: { type: String, required, validate },
    half_day_min_hours: { type: String, required, validate },
    mode: {
      type: String,
      required,
      enum: { values: [C.CONTINUOUS, C.ALTERNATE], message: C.VALUE_NOT_SUP },
    },
  },
  { timestamps: true, versionKey: false }
);

shiftSchema.plugin(any);

const Shift = mongoose.model("hr_shifts", shiftSchema);
module.exports = Shift;
