const router = require("express").Router();
const crypto = require("node:crypto");
const asyncHandler = require("express-async-handler");
const Razorpay = require("razorpay");
const RazorpayPayment = require("../models/fees/razorPayModel");
const User = require("../models/system/userModel");
const Student = require("../models/academics/studentModel");
const C = require("../constants");
const UC = require("../utils/common");

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_EMAIL } = process.env;

// Razorpay instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// const HOST = "https://gdgranchi.edusoft.in";
const HOST = "http://localhost:8001";

const createOrder = asyncHandler(async (req, res) => {
  let admNo = "TEST";
  const amount = req.body.amount;

  if (!admNo) {
    res.status(400);
    throw new Error(C.getFieldIsReq("admNo"));
  }

  if (!amount) {
    res.status(400);
    throw new Error(C.getFieldIsReq("amount"));
  }

  admNo = admNo.toUpperCase();

  const student = await Student.findOne({ admission_no: admNo })
    .select("name email phone address manager school")
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

  try {
    const order = await razorpay.orders.create(options);

    order.razorpay_key = RAZORPAY_KEY_ID;
    order.name = "Edusoft";
    order.description = "Student Fee Payment";

    let stuName = student.name.f;
    if (student.name.m) stuName += ` ${student.name.m}`;
    stuName += ` ${student.name.l}`;

    order.stuName = stuName;
    order.stuPhone = student.phone;
    order.stuEmail = student.email;
    order.stuAddress = student.address || "NA";

    await RazorpayPayment.create({
      order,
      student,
      manager: student.manager,
      school: student.school,
    });

    res.status(200).json(order);
  } catch (err) {
    res.status(400).json({ success: false, msg: "Something went wrong!" });
  }
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

  if (!isAuth) {
    const metadata = JSON.parse(req.body["error[metadata]"]);
    const orderId = metadata.order_id;
    const paymentId = metadata.payment_id;

    const order = await razorpay.orders.fetch(orderId);
    const payment = await razorpay.payments.fetch(paymentId);

    await RazorpayPayment.updateOne(
      { "order.id": orderId },
      { $set: { order: order, payment, signature: razorpay_signature } }
    );

    return res.redirect(`${HOST}/failure?msg=SIGNATURE_VERIFICATION_FAILED`);
  }

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

  UC.writeLog("verifyPayment", "END");
});

router.post("/pay", createOrder);

router.post("/verify", verifyPayment);

router.get("/key", (req, res) => {
  return res.status(200).send(RAZORPAY_KEY_ID);
});

router.get("/check-status", checkPaymentStatus);

router.get(
  "/payment-cancel",
  asyncHandler(async (req, res) => {
    console.log("req.body :>>", req.body);
    res.redirect(`${HOST}/payment-cancel`);
  })
);

module.exports = router;
