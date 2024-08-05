const mongoose = require("mongoose");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    order: { type: {}, required },
    student: { type: ObjectId, required, ref: "students" },
    payment: { type: {}, default: {} },
    signature: { type: String, default: "" },
    paid_for: [{ type: String, required }],
    total_amount: { type: Number, default: 0 },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

schema.index({ "order.id": 1 }, { unique: true });

const RazorpayFeePayment = mongoose.model("fee_term_razorpay", schema);
module.exports = RazorpayFeePayment;
