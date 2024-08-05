const mongoose = require("mongoose");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    student: { type: ObjectId, required, ref: "students" },
    payment_modes: {
      cash: { type: Number, default: 0 },
      online: {
        amount: { type: Number, default: 0 },
        transaction_id: { type: String, default: "" },
        bank: { type: String, default: "" },
      },
      cheques_or_dd: {
        amount: { type: Number, default: 0 },
        transaction_id: { type: String, default: "" },
        bank: { type: String, default: "" },
      },
      pos_machine: {
        amount: { type: Number, default: 0 },
        transaction_id: { type: String, default: "" },
        bank: { type: String, default: "" },
      },
    },
    paid_for: [{ type: String, required }],
    total_amount: { type: Number, default: 0 },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    collected_by: { type: ObjectId, required, ref: "users" },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

const ManualFeePayment = mongoose.model("fee_term_manual", schema);
module.exports = ManualFeePayment;
