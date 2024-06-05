const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");
const validate = require("validator");

const required = [true, C.FIELD_IS_REQ];
const ObjectId = mongoose.SchemaTypes.ObjectId;

const classRoutineSchema = new mongoose.Schema(
  {
    class: { type: ObjectId, required, ref: "academics_classes" },
    section: { type: ObjectId, required, ref: "academics_sections" },
    week: {
      type: String,
      required,
      enum: ["sun", "mon", "tues", "wed", "thurs", "fri", "sat"],
    },
    subject: { type: ObjectId, required, ref: "academics_subjects" },

    start_time: {
      type: String,
      required,
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Invalid time format, should be HH:mm",
      ],
    },
    end_time: {
      type: String,
      required,
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Invalid time format, should be HH:mm",
      ],
    },
    break: { type: Boolean, required },
    other_day: {
      type: String,
      required,
      enum: ["sun", "mon", "tues", "wed", "thurs", "fri", "sat"],
    },

    class_room: { type: String, required },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    school: { type: ObjectId, required, ref: "schools" },
  },

  { timestamps: true, versionKey: false }
);
classRoutineSchema.plugin(any),
  classRoutineSchema.pre("updateOne", async function (next) {
    this.setOptions({ runValidators: true });
    next();
  });

const ClassRoutine = mongoose.model("academic_classRoutine",classRoutineSchema);
module.exports = ClassRoutine;
