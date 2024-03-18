const mongoose = require("mongoose");
const C = require("../../constants");

const razorpaySchema = new mongoose.Schema(
  {
    order: { type: {}, required: [true, "order is required!"] },
    payment: { type: {}, default: {} },
    signature: { type: String, default: "" },
    student: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "students",
    },
    manager: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "users",
    },
    school: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "users",
    },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

const RazorpayPayment = mongoose.model("pg_razorpay_payments", razorpaySchema);
module.exports = RazorpayPayment;
