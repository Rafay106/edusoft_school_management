const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    name: { type: String, required, uppercase: true },
    term_type: {
      type: String,
      required,
      enum: { values: ["m", "bm", "q", "hy", "y"], message: C.VALUE_NOT_SUP },
    },
    year: { type: Number, required },
    start_month: { type: Number, required },
    late_fee_days: { type: Number, required },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.index(
  { term_type: 1, year: 1, start_month: 1, academic_year: 1, school: 1 },
  { unique: true }
);

schema.plugin(any);

const FeeTerm = mongoose.model("fee_terms", schema);
module.exports = FeeTerm;
