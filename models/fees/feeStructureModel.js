const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const amountSchema = new mongoose.Schema(
  {
    fee_type: { type: ObjectId, required, ref: "fee_types" },
    amount: { type: Number, required },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    class: { type: ObjectId, required, ref: "academics_classes" },
    boarding_type: { type: ObjectId, required, ref: "boarding_types" },
    one_time_fees: [amountSchema],
    term_fees: [amountSchema],
    partial_fees: [amountSchema],
    academic_year: { type: ObjectId, required, ref: "academic_years" },
  },
  { timestamps: true, versionKey: false }
);

schema.index(
  { class: 1, boarding_type: 1, academic_year: 1 },
  { unique: true }
);
schema.index({ _id: 1, "one_time_fees.fee_type": 1 }, { unique: true });
schema.index({ _id: 1, "term_fees.fee_type": 1 }, { unique: true });
schema.index({ _id: 1, "partial_fees.fee_type": 1 }, { unique: true });
schema.plugin(any);

const FeeStructure = mongoose.model("fee_structures", schema);
module.exports = FeeStructure;
