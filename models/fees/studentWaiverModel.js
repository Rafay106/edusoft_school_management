const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const feeTypesSchema = new mongoose.Schema(
  {
    fee_type: { type: ObjectId, required, ref: "fee_types" },
    amount: { type: Number, required },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    student: { type: ObjectId, required, ref: "students" },
    fee_term: { type: ObjectId, ref: "fee_terms" },
    fee_types: [feeTypesSchema],
    note: { type: String, default: "" },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ student: 1, fee_term: 1, academic_year: 1 }, { unique: true });
schema.index({ _id: 1, "fee_types.fee_type": 1 }, { unique: true });
schema.plugin(any);

const StudentWaiver = mongoose.model("fee_waiver_students", schema);
module.exports = StudentWaiver;
