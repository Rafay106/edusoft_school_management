const mongoose = require("mongoose");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const razorpaySchema = new mongoose.Schema(
  {
    order: { type: {}, required },
    payment: { type: {}, default: {} },
    signature: { type: String, default: "" },
    student: { type: ObjectId, required, ref: "students" },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

const RazorpayPayment = mongoose.model("pg_razorpay_payments", razorpaySchema);
module.exports = RazorpayPayment;
