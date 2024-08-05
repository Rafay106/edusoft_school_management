const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const required = [true, C.FIELD_IS_REQ];
const { timeValidator } = require("../../utils/validators");
const { validateBusStopByName } = require("../../utils/common");
const timingErr = (props) => {
  return `${props.path}: '${props.value}' is not a valid 24-hour time format (HH:MM)!`;
};
const validate = { validator: timeValidator, message: timingErr };

const shiftRuleSchema = new mongoose.Schema(
  {
    shift:{type:ObjectId,required,refs:"hr_shifts"},
    clock_in_time_valid:{type: String, required, validate },
    clock_out_early_time: { type: String, required, validate },
    late_allow: { type: String, required, default: "" }, // 10 min late is allowed
    early_leave_allow: { type: String, required, values:{
         enum:[C.YES,C.NO],
         msg:C.VALUE_NOT_SUP
    }},
    overtime: { type: String, validate },
    is_clock_in: {
      type: String,


      default: "no",
      enum: {
        values: [C.YES, C.NO],
        message: C.VALUE_NOT_SUP,
      },
    },
    is_clock_out: {
      type: String,
      default: "no",
      enum: {
        values: [C.YES, C.NO],
        message: C.VALUE_NOT_SUP,
      },
    },
    weekend: {
      type: String,
      required,
      enum: {
        values: ["sun", "mon", "tues", "wed", "thurs", "fri", "sat"],
        message: C.VALUE_NOT_SUP,
      },
    },
    
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const ShiftRule = mongoose.model("hr_shift_rule", shiftRuleSchema);
module.exports = ShiftRule;
