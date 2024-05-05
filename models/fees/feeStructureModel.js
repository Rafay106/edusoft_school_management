const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const feetypeSchema = new mongoose.Schema({
  fee_type: {
    type: ObjectId,
    required: [true, C.FIELD_IS_REQ],
    ref: "fee_types",
  },
  amount: { type: Number, required: [true, C.FIELD_IS_REQ] },
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
    school: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "schools",
    },
  },
  { timestamps: true, versionKey: false }
);

schema.plugin(any);

const FeeStructure = mongoose.model("fee_structures", schema);
module.exports = FeeStructure;
