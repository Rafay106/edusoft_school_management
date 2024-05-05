const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
    year: { type: String, required: [true, C.FIELD_IS_REQ] },
    title: { type: String, required: [true, C.FIELD_IS_REQ] },
    starting_date: { type: Date, required: [true, C.FIELD_IS_REQ] },
    ending_date: { type: Date, required: [true, C.FIELD_IS_REQ] },
    school: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "schools",
    },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ year: 1 }, { unique: true });

schema.plugin(any);

const AcademicYear = mongoose.model("academic_years", schema);
module.exports = AcademicYear;
