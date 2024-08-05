const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    year: { type: String, required },
    title: { type: String, required },
    starting_date: { type: Date, required },
    ending_date: { type: Date, required },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ year: 1 }, { unique: true });

schema.plugin(any);

const AcademicYear = mongoose.model("academic_years", schema);
module.exports = AcademicYear;
