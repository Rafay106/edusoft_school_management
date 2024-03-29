const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const feetypeSchema = new mongoose.Schema({
  fee_head: {
    type: ObjectId,
    required: [true, C.FIELD_IS_REQ],
    ref: "fee_heads",
  },
  amounts: [
    {
      type: {
        type: ObjectId,
        required: [true, C.FIELD_IS_REQ],
        ref: "student_types",
      },
      amount: { type: Number, required: [true, C.FIELD_IS_REQ] },
    },
  ],
});

const schema = new mongoose.Schema(
  {
    class: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "classes" },
    fee_period: { type: String, required: [true, C.FIELD_IS_REQ] },
    stream: { type: String, default: "" },
    fee_types: [feetypeSchema],
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

const FeeStructure = mongoose.model("fee_structures", schema);
module.exports = FeeStructure;
