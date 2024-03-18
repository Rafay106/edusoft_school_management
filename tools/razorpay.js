const router = require("express").Router();
const crypto = require("node:crypto");
const asyncHandler = require("express-async-handler");
const Razorpay = require("razorpay");
const RazorpayPayment = require("../models/fees/razorPayModel");
const C = require("../constants");
const User = require("../models/system/userModel");
const Student = require("../models/academics/studentModel");

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_EMAIL } = process.env;

// Razorpay instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// const HOST = "https://gdgranchi.edusoft.in";
const HOST = "http://localhost:8001";

const createOrder = asyncHandler(async (req, res) => {
  let admissionNo = "TEST";
  const amount = req.body.amount;

  if (!admissionNo) {
    res.status(400);
    throw new Error(C.getFieldIsReq("admissionNo"));
  }

  if (!amount) {
    res.status(400);
    throw new Error(C.getFieldIsReq("amount"));
  }

  admissionNo = admissionNo.toUpperCase();

  const student = await Student.findOne({ admissionNo })
    .select("manager school")
    .lean();

  if (!student) {
    res.status(400);
    throw new Error("Student not found!");
  }

  const options = {
    amount: amount * 100, // Amount in paise
    currency: "INR",
    receipt: RAZORPAY_EMAIL,
  };

  // try {
  const order = await razorpay.orders.create(options);

  order.name = "Edusoft";
  order.description = "Student Fee Payment";

  await RazorpayPayment.create({
    order,
    student,
    manager: student.manager,
    school: student.school,
  });

  res.status(200).json(order);
  // } catch (err) {
  //   res.status(400).json({ success: false, msg: "Something went wrong!" });
  // }
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuth = expSignature === razorpay_signature;

  if (!isAuth) return res.status(400).json({ success: false });

  const order = await razorpay.orders.fetch(razorpay_order_id);
  const payment = await razorpay.payments.fetch(razorpay_payment_id);

  await RazorpayPayment.updateOne(
    { "order.id": razorpay_order_id },
    { $set: { order: order, payment, signature: razorpay_signature } }
  );

  if (!payment.captured) {
    return res.redirect(
      `${HOST}/failure?order_id=${razorpay_order_id}&amount=${amount}`
    );
  }

  const amount = payment.amount / 100;

  return res.redirect(
    `${HOST}/success?order_id=${razorpay_order_id}&payment_id=${razorpay_payment_id}&amount=${amount}`
  );
});

const checkPaymentStatus = asyncHandler(async (req, res) => {
  const payment_id = req.query.payment_id;

  if (!payment_id) {
    res.status(400);
    throw new Error(C.getFieldIsReq("payment_id"));
  }

  const payment = await razorpay.payments.fetch(payment_id);

  res.status(200).json(payment);
});

router.post("/pay", createOrder);

router.post("/verify", verifyPayment);

router.get("/key", (req, res) => {
  return res.status(200).send(RAZORPAY_KEY_ID);
});

router.get("/check-status", checkPaymentStatus);

module.exports = router;
