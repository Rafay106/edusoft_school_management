const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const schema = new mongoose.Schema(
  {
    year: { type: String, required: [true, C.FIELD_IS_REQ] },
    title: { type: String, required: [true, C.FIELD_IS_REQ] },
    starting_date: { type: Date, required: [true, C.FIELD_IS_REQ] },
    ending_date: { type: Date, required: [true, C.FIELD_IS_REQ] },
    manager: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "users",
    },
    school: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "users",
    },
  },
  { timestamps: true }
);

schema.plugin(any);

const AcademicYear = mongoose.model("academic_years", schema);
module.exports = AcademicYear;
