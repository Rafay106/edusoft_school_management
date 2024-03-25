const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
    name: { type: String, required: [true, C.FIELD_IS_REQ] },
    term_type: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      enum: { values: ["m", "bm"], message: C.VALUE_NOT_SUP },
    },
    year: { type: Number, required: [true, C.FIELD_IS_REQ] },
    start_month: { type: Number, required: [true, C.FIELD_IS_REQ] },
    late_fee_date: { type: Date, required: [true, C.FIELD_IS_REQ] },
    academic_year: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "academic_years",
    },
    manager: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
    school: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
  },
  { timestamps: true }
);

schema.plugin(any);

const FeeTerm = mongoose.model("fee_terms", schema);
module.exports = FeeTerm;
