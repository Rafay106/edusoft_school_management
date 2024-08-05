const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const feeTypeSchema = new mongoose.Schema(
  {
    fee_type: { type: ObjectId, required, ref: "fee_types" },
    is_percentage: { type: Boolean, default: false },
    amount: { type: Number, required },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    student: { type: ObjectId, required, ref: "students" },
    fee_term: { type: ObjectId, required, ref: "fee_terms" },
    fee_types: [feeTypeSchema],
    academic_year: { type: ObjectId, required, ref: "academic_years" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ student: 1, fee_term: 1, academic_year: 1 }, { unique: true });
schema.plugin(any);

const FeeConcession = mongoose.model("fee_concessions", schema);
module.exports = FeeConcession;
