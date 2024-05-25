const router = require("express").Router();
const crypto = require("node:crypto");
const asyncHandler = require("express-async-handler");
const Razorpay = require("razorpay");
const RazorpayPayment = require("../models/fees/razorPayModel");
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

const STUDENTS = [
  {
    name: "Mohit Sain",
    admission_no: "A123",
    fees: "2500",
    phone: "911231231230",
    email: "mohit@gmail.com",
    address: "",
  },
  {
    name: "Vishal Singh",
    admission_no: "A234",
    fees: "3500",
    phone: "911231231230",
    email: "vishal@gmail.com",
    address: "",
  },
  {
    name: "Mudit Mangtani",
    admission_no: "A345",
    fees: "4500",
    phone: "911231231230",
    email: "mudit@gmail.com",
    address: "",
  },
  {
    name: "Divij Gupta",
    admission_no: "A456",
    fees: "2500",
    phone: "911231231230",
    email: "divij@gmail.com",
    address: "",
  },
  {
    name: "Raghav Jhalani",
    admission_no: "A567",
    fees: "3000",
    phone: "911231231230",
    email: "raghav@gmail.com",
    address: "",
  },
];

const createOrder = asyncHandler(async (req, res) => {
  let admNo = req.body.adm_no;

  if (!admNo) {
    res.status(400);
    throw new Error(C.getFieldIsReq("admNo"));
  }

  admNo = admNo.toUpperCase();

  // const student = await Student.findOne({ admission_no: admNo })
  //   .select("name email phone address manager school")
  //   .lean();

  const student = STUDENTS.find((ele) => ele.admission_no === admNo);

  if (!student) {
    res.status(400);
    throw new Error("Student not found!");
  }

  const amount = parseInt(student.fees);

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

    order.stuName = student.name; // stuName;
    order.stuPhone = student.phone;
    order.stuEmail = student.email;
    order.stuAddress = student.address || "NA";

    await RazorpayPayment.create({
      order,
      student: "65f83813b5a6842a063f4782",
      manager: "65f82505e113e46069900161",
      school: "65f82511e113e46069900173",
    });

    res.status(200).json(order);
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, msg: err.error || err.message });
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

router.get(
  "/fee-list",
  asyncHandler((req, res) => {
    res.json(STUDENTS);
  })
);

module.exports = router;
