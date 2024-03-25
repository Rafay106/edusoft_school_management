const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
    class: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "classes" },
    term: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "fee_terms",
    },
    student_type: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "student_types",
    },
    type: { type: String, required: [true, C.FIELD_IS_REQ] },
    amount: { type: Number, required: [true, C.FIELD_IS_REQ] },
    range: {
      start: { type: Number, required: [true, C.FIELD_IS_REQ] },
      end: { type: Number, required: [true, C.FIELD_IS_REQ] },
    },
    fixed: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
    date_range: {
      start: { type: Date, required: [true, C.FIELD_IS_REQ] },
      end: { type: Date, required: [true, C.FIELD_IS_REQ] },
    },
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

const FeeFine = mongoose.model("fee_fines", schema);
module.exports = FeeFine;
