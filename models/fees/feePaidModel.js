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

const termFeeSchema = new mongoose.Schema(
  {
    fee_term: { type: ObjectId, required, ref: "fee_terms" },
    fee_types: [amountSchema],
    term_amount: { type: Number, required },
    term_fine: { type: Number, required },
    term_fine_msg: { type: String, default: "" },
    term_concession: { type: Number, required },
    term_due: { type: Number, required },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    student: { type: ObjectId, required, ref: "students" },
    razorpay_payments: [{ type: ObjectId, ref: "fee_term_razorpay" }],
    manual_fee_payments: [{ type: ObjectId, ref: "fee_term_manual" }],
    one_time_fees: [amountSchema],
    term_fees: [termFeeSchema],
    partial_fees: [termFeeSchema],
    total_amount: { type: Number, required },
    total_concession: { type: Number, required },
    total_fine: { type: Number, required },
    total_due_amount: { type: Number, required },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
  },
  { timestamps: true, versionKey: false, collection: "fee_paid" }
);

schema.index({ student: 1, academic_year: 1 }, { unique: true });
schema.plugin(any);

const FeePaid = mongoose.model("fee_paid", schema);
module.exports = FeePaid;
