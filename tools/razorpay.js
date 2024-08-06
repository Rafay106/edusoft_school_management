const crypto = require("node:crypto");
const assert = require("node:assert");
const School = require("../models/system/schoolModel");
const Razorpay = require("razorpay");
const RazorpayFeePayment = require("../models/fees/razorpayFeePaymentModel");
const FeePaid = require("../models/fees/feePaidModel");
const C = require("../constants");
const LEDGER = require("../services/ledger");
const FEE = require("../utils/fees");

const { DOMAIN, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_EMAIL } =
  process.env;

// Razorpay instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const createStudentFeeOrder = async (orderName, orderDesc, student, amount) => {
  assert(orderName !== undefined, "orderName missing!");
  assert(orderDesc !== undefined, "orderDesc missing!");
  assert(student !== undefined, "student missing!");
  assert(amount !== undefined, "amount missing!");

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: RAZORPAY_EMAIL,
  });

  order.razorpay_key = RAZORPAY_KEY_ID;
  order.name = orderName;
  order.description = orderDesc;

  order.stuName = student.name;
  order.stuPhone = student.phone;
  order.stuEmail = student.email;
  order.stuAddress = student.address.permanent || "NA";
  order.redirect_url = `${DOMAIN}/api/razorpay/verify/student-fee-payment`;

  return order;
};

const baseURL = `${DOMAIN}/student-fee-payment`;
// const baseURL = `http://localhost:3000/student-fee-payment`;

const verifyStudentFeePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuth = expSignature === razorpay_signature;

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    await RazorpayFeePayment.updateOne(
      { "order.id": razorpay_order_id },
      { $set: { order: order, payment, signature: razorpay_signature } }
    );

    if (!isAuth) {
      return res.redirect(
        `${baseURL}/failure?msg=SIGNATURE_VERIFICATION_FAILED`
      );
    }

    if (!payment.captured) {
      return res.redirect(
        `${baseURL}/failure?msg=PAYMENT_CAPTURE_FAILED&order_id=${razorpay_order_id}&amount=${amount}`
      );
    }

    const amount = payment.amount / 100;

    const rpPayment = await RazorpayFeePayment.findOne({
      "order.id": razorpay_order_id,
    })
      .populate("student", "admission_no name academic_year school")
      .lean();

    const [oneTimeFees, termFees, partialFees] = FEE.splitFeesArrays(
      rpPayment.paid_for
    );

    const fees = await FEE.getStudentFees(
      rpPayment.student.admission_no,
      rpPayment.academic_year,
      termFees,
      partialFees,
      oneTimeFees
    );

    if (
      await FeePaid.any({
        student: fees.student._id,
        academic_year: rpPayment.academic_year,
      })
    ) {
      await FeePaid.updateOne(
        { student: fees.student._id, academic_year: rpPayment.academic_year },
        {
          $push: {
            razorpay_payments: rpPayment._id,
            one_time_fees: fees.one_time_fees,
            term_fees: fees.term_fees,
            partial_fees: fees.partial_fees,
          },
          $inc: {
            total_amount: fees.total_amount,
            total_concession: fees.total_concession,
            total_fine: fees.total_fine,
            total_due_amount: fees.total_due_amount,
          },
        }
      );
    } else {
      const feePaid = await FeePaid.create({
        student: fees.student._id,
        razorpay_payments: [rpPayment._id],
        one_time_fees: fees.one_time_fees,
        term_fees: fees.term_fees,
        partial_fees: fees.partial_fees,
        total_amount: fees.total_amount,
        total_concession: fees.total_concession,
        total_fine: fees.total_fine,
        total_due_amount: fees.total_due_amount,
        academic_year: rpPayment.academic_year,
      });
    }

    // Ledger
    const bank = req.school?.defaults?.razorpay_bank;

    if (bank) {
      const note = `STUDENT ONLINE PORTAL FEE PAYMENT: ${razorpay_order_id}`;

      const ledger = await LEDGER.credit(
        C.ONLINE,
        payment.amount / 100,
        note,
        C.FEE_COLLECTION,
        bank
      );
    }

    return res.redirect(
      `${baseURL}/success?order_id=${razorpay_order_id}&payment_id=${razorpay_payment_id}&amount=${amount}`
    );
  } catch (error) {
    console.log(error);
    return res.redirect(
      `${baseURL}/internal-server-error?error=${JSON.stringify(error)}`
    );
  }
};

const verifyStudentFeePaymentFlutter = async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;

    assert(order_id !== undefined, C.getFieldIsReq("order_id"));
    assert(payment_id !== undefined, C.getFieldIsReq("payment_id"));
    assert(signature !== undefined, C.getFieldIsReq("signature"));

    const body = order_id + "|" + payment_id;
    const expSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuth = expSignature === signature;

    const order = await razorpay.orders.fetch(order_id);
    const payment = await razorpay.payments.fetch(payment_id);

    await RazorpayFeePayment.updateOne(
      { "order.id": order_id },
      { $set: { order: order, payment, signature: signature } }
    );

    if (!isAuth) {
      return res.json({ success: false, msg: "SIGNATURE_VERIFICATION_FAILED" });
    }

    if (!payment.captured) {
      return res.json({ success: false, msg: "PAYMENT_CAPTURE_FAILED" });
    }

    const rpPayment = await RazorpayFeePayment.findOne({
      "order.id": order_id,
    })
      .populate("student", "name academic_year school")
      .lean();

    const termsSummary = rpPayment.terms_summary;

    for (const ts of termsSummary) {
      const feePaid = await FeePaid.create({
        student: rpPayment.student._id,
        razorpay_payment: rpPayment._id,
        fee_term: ts.fee_term,
        fee_types: ts.fee_types,
        amount: ts.amount,
        concession: ts.concession,
        fine: ts.fine,
        final_amount: ts.final_amount,
        academic_year: rpPayment.student.academic_year,
      });
    }

    // Ledger
    const bank = req.school?.defaults?.razorpay_bank;

    if (bank) {
      const note = `Student Fee Payment Online Order: ${razorpay_order_id}`;
      const ledger = await LEDGER.credit(
        C.ONLINE,
        payment.amount / 100,
        note,
        C.FEE_COLLECTION,
        bank
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.json({
      success: false,
      msg: `INTERNAL_SERVER_ERROR: ${err.message}`,
    });
  }
};

const addSchoolToReq = async (req, res, next) => {
  const school = await School.findOne().lean();

  req.school = school;

  next();
};

module.exports = {
  createStudentFeeOrder,
  verifyStudentFeePayment,
  verifyStudentFeePaymentFlutter,
  addSchoolToReq,
};
