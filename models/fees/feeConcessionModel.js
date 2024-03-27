const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const feeHeadSchema = new mongoose.Schema({
  fee_head: {
    type: ObjectId,
    required: [true, C.FIELD_IS_REQ],
    ref: "fee_heads",
  },
  is_percentage: { type: Boolean, default: false },
  amount: { type: Number, required: [true, C.FIELD_IS_REQ] },
});

const schema = new mongoose.Schema(
  {
    type: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "student_types",
    },
    class: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "classes" },
    fee_term: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "fee_terms",
    },
    fee_heads: [feeHeadSchema],
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

const FeeConcession = mongoose.model("fee_concessions", schema);
module.exports = FeeConcession;
