const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    student: { type: ObjectId, required, ref: "students" },
    fee_term: { type: ObjectId, required, ref: "fee_terms" },
    fee_types: [
      {
        fee_type: { type: ObjectId, required, ref: "fee_types" },
        amount: { type: Number, required },
      },
    ],
    fee_concession: [
      {
        fee_type: { type: ObjectId, required, ref: "fee_types" },
        amount: { type: Number, required },
      },
    ],
    fee_fine: { type: Number, required },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ student: 1, fee_term: 1 }, { unique: true });
schema.plugin(any);

const FeePayment = mongoose.model("fee_payments", schema);
module.exports = FeePayment;
